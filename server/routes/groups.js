const express = require("express");
const router = express.Router();
const { supabase, supabaseAdmin } = require("../utils/supabaseClient");
const authenticateToken = require("../middleware/authenticateToken");
const {
  calculateOptimalSettlements,
  validateSettlements,
  calculateSettlementStats,
} = require("../utils/settlementOptimizer");

// Create a new group
router.post("/groups", authenticateToken, async (req, res) => {
  const { name, memberPhones } = req.body;
  const creatorId = req.user.sub;

  console.log("🔍 Group Creation Request:", {
    name,
    memberPhones,
    creatorId,
    userObject: req.user,
  });

  if (!name || !memberPhones || !Array.isArray(memberPhones)) {
    console.log("❌ Validation failed:", { name, memberPhones });
    return res
      .status(400)
      .json({ error: "Group name and member phone numbers are required" });
  }

  try {
    console.log("🔍 Finding users by phone numbers:", memberPhones);

    // Find all users by phone numbers
    const { data: users, error: usersError } = await supabaseAdmin
      .from("details")
      .select("id, ph_number, full_name")
      .in("ph_number", memberPhones);

    if (usersError) {
      console.error("❌ Users query error:", usersError);
      return res
        .status(400)
        .json({ error: "Failed to find users by phone numbers" });
    }

    console.log("✅ Found users:", users?.length, users);

    // Check if all phone numbers were found
    const foundPhones = users.map((u) => String(u.ph_number)); // Convert to string for comparison
    const notFoundPhones = memberPhones.filter(
      (phone) => !foundPhones.includes(String(phone))
    );

    if (notFoundPhones.length > 0) {
      console.log("❌ Some users not found:", notFoundPhones);
      return res.status(404).json({
        error: `Users not found for phone numbers: ${notFoundPhones.join(
          ", "
        )}`,
      });
    }

    console.log("🔍 Creating group..."); // Create the group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .insert([
        {
          name,
          creator_id: creatorId,
        },
      ])
      .select()
      .single();

    if (groupError) {
      console.error("❌ Group creation error:", groupError);
      return res
        .status(400)
        .json({ error: "Failed to create group: " + groupError.message });
    }
    console.log("✅ Group created:", group);

    // Add members to the group (including creator)
    const memberIds = users.map((u) => u.id);
    if (!memberIds.includes(creatorId)) {
      memberIds.push(creatorId);
    }

    console.log("🔍 Member IDs to add:", memberIds);
    console.log("🔍 Creator ID:", creatorId);

    // Remove duplicates to avoid constraint errors
    const uniqueMemberIds = [...new Set(memberIds)];
    console.log("🔍 Unique member IDs:", uniqueMemberIds);

    const groupMembers = uniqueMemberIds.map((memberId) => ({
      group_id: group.id,
      user_id: memberId,
      joined_at: new Date().toISOString(),
    }));

    console.log("🔍 Group members to insert:", groupMembers);

    const { data: members, error: membersError } = await supabaseAdmin
      .from("group_members")
      .insert(groupMembers)
      .select();

    if (membersError) {
      console.error("❌ Members insertion error:", membersError);
      return res.status(400).json({
        error: "Failed to add group members",
        details: membersError.message,
      });
    }

    res.json({
      message: "Group created successfully",
      group: group,
      members: members,
    });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get user's groups
router.get("/groups", authenticateToken, async (req, res) => {
  const userId = req.user.sub;

  try {
    const { data: userGroups, error } = await supabaseAdmin
      .from("group_members")
      .select(
        `
        groups (
          id,
          name,
          creator_id,
          created_at
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const groups = userGroups.map((ug) => ug.groups);
    res.json({ data: groups });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Get group details with members
router.get("/groups/:id", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;

  try {
    // Check if user is a member of this group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: "Access denied to this group" });
    }

    // Get group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: "Group not found" });
    }
    // Get group members (using manual join since FK relationship may not be defined)
    const { data: groupMembers, error: membersError } = await supabaseAdmin
      .from("group_members")
      .select("user_id, joined_at")
      .eq("group_id", groupId);

    if (membersError) {
      return res.status(400).json({ error: "Failed to fetch group members" });
    }

    // Get user details for all members
    let members = [];
    if (groupMembers.length > 0) {
      const userIds = groupMembers.map((m) => m.user_id);
      const { data: userDetails, error: userDetailsError } = await supabaseAdmin
        .from("details")
        .select("id, full_name, ph_number, profile_pic")
        .in("id", userIds);

      if (userDetailsError) {
        return res.status(400).json({ error: "Failed to fetch user details" });
      }

      // Combine group member data with user details
      members = groupMembers.map((member) => ({
        user_id: member.user_id,
        joined_at: member.joined_at,
        details: userDetails.find((d) => d.id === member.user_id),
      }));
    }

    res.json({
      group: group,
      members: members,
    });
  } catch (err) {
    console.error("Error fetching group details:", err);
    res.status(500).json({ error: "Failed to fetch group details" });
  }
});

// Send message to group
router.post("/groups/:id/messages", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;
  const { message } = req.body;

  console.log("💬 Message send attempt:");
  console.log("   User ID:", userId);
  console.log("   Group ID:", groupId);
  console.log("   Message:", message);

  if (!message || message.trim() === "") {
    console.log("❌ Empty message rejected");
    return res.status(400).json({ error: "Message content is required" });
  }

  try {
    // Check if user is a member of this group
    console.log("🔍 Checking group membership...");
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    console.log(
      "📋 Membership check result:",
      membership ? "Found" : "Not found"
    );
    if (membershipError) {
      console.log("❌ Membership error:", membershipError.message);
    }

    if (membershipError || !membership) {
      console.log("🚫 Access denied - user not a member");
      return res.status(403).json({ error: "Access denied to this group" });
    } // Insert message
    console.log("📝 Inserting message into database...");
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from("group_messages")
      .insert([
        {
          group_id: groupId,
          sender_id: userId,
          message: message.trim(),
          sent_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (messageError) {
      console.log("❌ Message insert error:", messageError.message);
      console.log("❌ Full error details:", messageError);
      return res
        .status(400)
        .json({ error: `Failed to send message: ${messageError.message}` });
    } // Fetch user details separately
    console.log("🔍 Fetching user details for sender:", userId);
    const { data: userDetails, error: userError } = await supabaseAdmin
      .from("details")
      .select("full_name, profile_pic")
      .eq("id", userId)
      .single();

    console.log("👤 User details query result:", userDetails);
    console.log("❌ User details error:", userError);

    if (!userError && userDetails) {
      newMessage.details = userDetails;
      console.log("✅ Added user details to message:", userDetails);
    } else {
      console.log("⚠️ No user details found for sender:", userId);
    }

    console.log("✅ Message sent successfully");
    res.json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (err) {
    console.error("❌ Unexpected error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get group messages
router.get("/groups/:id/messages", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;
  const { limit = 20, offset = 0 } = req.query;

  console.log("🔍 Fetching messages for group:", groupId, "user:", userId);

  try {
    // Check if user is a member of this group
    console.log("🔍 Checking group membership...");
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      console.log(
        "❌ Membership check failed:",
        membershipError?.message || "No membership found"
      );
      return res.status(403).json({ error: "Access denied to this group" });
    }
    console.log("✅ User is member of group");

    // Get messages with basic query first
    console.log("🔍 Fetching messages...");
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("group_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("sent_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (messagesError) {
      console.error("❌ Messages query failed:", messagesError);
      return res
        .status(400)
        .json({ error: "Failed to fetch messages: " + messagesError.message });
    }
    // Fetch user details for each message
    console.log("🔍 Fetching user details for messages...");
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        console.log(
          "👤 Looking up user details for sender:",
          message.sender_id
        );
        const { data: userDetails, error: userError } = await supabaseAdmin
          .from("details")
          .select("full_name, profile_pic")
          .eq("id", message.sender_id)
          .single();

        console.log("👤 User details for", message.sender_id, ":", userDetails);
        if (userError) console.log("❌ User lookup error:", userError.message);

        return {
          ...message,
          details: userError ? null : userDetails,
        };
      })
    );

    console.log(
      "✅ Messages with details prepared:",
      messagesWithDetails?.length || 0
    );

    res.json({ data: messagesWithDetails.reverse() }); // Reverse to show oldest first
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Transition group to settlement phase
router.post("/groups/:id/settle", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;

  console.log("⚖️ Initiating settlement phase for group:", groupId);
  console.log("🔍 User ID from token:", userId);

  try {
    // Verify user is the creator of the group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      console.log("❌ Group not found:", groupError);
      return res.status(404).json({ error: "Group not found" });
    }

    console.log("📋 Group found:", {
      id: group.id,
      creator_id: group.creator_id,
      phase: group.phase,
    });
    console.log("🔍 Creator check:", {
      userIdFromToken: userId,
      creatorId: group.creator_id,
      match: group.creator_id === userId,
    });

    if (group.creator_id !== userId) {
      console.log("❌ User is not the creator");
      return res
        .status(403)
        .json({ error: "Only the group creator can initiate settlement" });
    }

    if (group.phase === "settlement") {
      console.log("❌ Group already in settlement phase");
      return res
        .status(400)
        .json({ error: "Group is already in settlement phase" });
    }

    // Get current balances
    const { data: settlements, error: settlementsError } = await supabaseAdmin
      .from("expense_settlements")
      .select("*")
      .eq("group_id", groupId);

    if (settlementsError) {
      return res
        .status(400)
        .json({ error: "Failed to fetch current balances" });
    }

    // Get group members
    const { data: members, error: membersError } = await supabaseAdmin
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (membersError) {
      return res.status(400).json({ error: "Failed to fetch group members" });
    }

    // Calculate net balances for each member
    const memberBalances = {};
    members.forEach((member) => {
      memberBalances[member.user_id] = {
        userId: member.user_id,
        netBalance: 0,
      };
    });

    // Process current settlements to get net balances
    settlements.forEach((settlement) => {
      if (settlement.amount > 0) {
        memberBalances[settlement.debtor_id].netBalance -= settlement.amount;
        memberBalances[settlement.creditor_id].netBalance += settlement.amount;
      }
    });

    const balancesArray = Object.values(memberBalances);
    console.log("📊 Current net balances:", balancesArray);

    // Calculate optimal settlements using greedy algorithm
    const optimalSettlements = calculateOptimalSettlements(balancesArray);

    // Validate settlements
    const isValid = validateSettlements(balancesArray, optimalSettlements);
    if (!isValid) {
      return res
        .status(500)
        .json({ error: "Settlement calculation validation failed" });
    }

    // Calculate statistics
    const stats = calculateSettlementStats(balancesArray, optimalSettlements);
    console.log("📈 Settlement statistics:", stats);

    // Start database transaction
    const { error: phaseUpdateError } = await supabaseAdmin
      .from("groups")
      .update({
        phase: "settlement",
        settled_at: new Date().toISOString(),
      })
      .eq("id", groupId);

    if (phaseUpdateError) {
      return res.status(400).json({ error: "Failed to update group phase" });
    }

    // Store individual balances
    const individualBalanceRecords = balancesArray.map((balance) => ({
      user_id: balance.userId,
      group_id: groupId,
      net_amount: balance.netBalance,
    }));

    if (individualBalanceRecords.length > 0) {
      const { error: balancesError } = await supabaseAdmin
        .from("individual_balances")
        .upsert(individualBalanceRecords, {
          onConflict: "user_id,group_id",
        });

      if (balancesError) {
        console.error("❌ Failed to store individual balances:", balancesError);
        return res
          .status(400)
          .json({ error: "Failed to store individual balances" });
      }
    } // Store optimized settlements
    if (optimalSettlements.length > 0) {
      const optimizedSettlementRecords = optimalSettlements.map(
        (settlement) => ({
          group_id: groupId,
          debtor_id: settlement.from,
          creditor_id: settlement.to,
          amount: settlement.amount,
          status: "pending",
        })
      );

      const { error: optimizedError } = await supabaseAdmin
        .from("optimized_settlements")
        .insert(optimizedSettlementRecords);

      if (optimizedError) {
        console.error(
          "❌ Failed to store optimized settlements:",
          optimizedError
        );
        return res
          .status(400)
          .json({ error: "Failed to store optimized settlements" });
      }

      // Create loan records for each settlement
      console.log("💰 Creating loan records for settlements...");
      const loanRecords = optimalSettlements.map((settlement) => ({
        lender_id: settlement.to, // The person receiving money is the lender
        receiver_id: settlement.from, // The person paying is the receiver/borrower
        amount: settlement.amount,
        reason: `Group settlement for "${group.name}"`,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: "confirmed", // Settlement loans are automatically confirmed
      }));

      const { error: loanError } = await supabaseAdmin
        .from("loans")
        .insert(loanRecords);

      if (loanError) {
        console.error("❌ Failed to create loan records:", loanError);
        // Don't fail the entire settlement, just log the error
        console.error("⚠️ Settlement completed but loan records not created");
      } else {
        console.log(
          "✅ Loan records created successfully:",
          loanRecords.length
        );
      }
    }

    console.log("✅ Settlement phase initiated successfully");
    res.json({
      message: "Settlement phase initiated successfully",
      stats: stats,
      settlements: optimalSettlements,
    });
  } catch (err) {
    console.error("❌ Error initiating settlement:", err);
    res.status(500).json({ error: "Failed to initiate settlement phase" });
  }
});

// Get optimized settlements for a group in settlement phase
router.get(
  "/groups/:id/optimized-settlements",
  authenticateToken,
  async (req, res) => {
    const userId = req.user.sub;
    const groupId = req.params.id;

    try {
      // Verify user is a member of the group
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

      if (membershipError || !membership) {
        return res.status(403).json({ error: "Access denied to this group" });
      }

      // Verify group is in settlement phase
      const { data: group, error: groupError } = await supabaseAdmin
        .from("groups")
        .select("phase")
        .eq("id", groupId)
        .single();

      if (groupError || !group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.phase !== "settlement") {
        return res
          .status(400)
          .json({ error: "Group is not in settlement phase" });
      }

      // Get optimized settlements
      const { data: settlements, error: settlementsError } = await supabaseAdmin
        .from("optimized_settlements")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (settlementsError) {
        return res.status(400).json({ error: "Failed to fetch settlements" });
      }

      // Get user details for all involved users
      const userIds = [
        ...new Set([
          ...settlements.map((s) => s.debtor_id),
          ...settlements.map((s) => s.creditor_id),
        ]),
      ];

      let userDetails = {};
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabaseAdmin
          .from("details")
          .select("id, full_name, profile_pic")
          .in("id", userIds);

        if (!usersError && users) {
          users.forEach((user) => {
            userDetails[user.id] = user;
          });
        }
      }

      // Enrich settlements with user details
      const enrichedSettlements = settlements.map((settlement) => ({
        ...settlement,
        debtor: userDetails[settlement.debtor_id] || null,
        creditor: userDetails[settlement.creditor_id] || null,
      }));

      res.json({ data: enrichedSettlements });
    } catch (err) {
      console.error("❌ Error fetching optimized settlements:", err);
      res.status(500).json({ error: "Failed to fetch optimized settlements" });
    }
  }
);

// Mark a settlement as completed
router.post(
  "/groups/:groupId/settlements/:settlementId/complete",
  authenticateToken,
  async (req, res) => {
    const userId = req.user.sub;
    const { groupId, settlementId } = req.params;

    try {
      // Get the settlement
      const { data: settlement, error: settlementError } = await supabaseAdmin
        .from("optimized_settlements")
        .select("*")
        .eq("id", settlementId)
        .eq("group_id", groupId)
        .single();

      if (settlementError || !settlement) {
        return res.status(404).json({ error: "Settlement not found" });
      }

      // Verify user is either the debtor or creditor
      if (
        settlement.debtor_id !== userId &&
        settlement.creditor_id !== userId
      ) {
        return res
          .status(403)
          .json({ error: "You can only mark settlements you are involved in" });
      }

      // Update settlement status
      const { error: updateError } = await supabaseAdmin
        .from("optimized_settlements")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", settlementId);

      if (updateError) {
        return res
          .status(400)
          .json({ error: "Failed to update settlement status" });
      }

      res.json({ message: "Settlement marked as completed" });
    } catch (err) {
      console.error("❌ Error completing settlement:", err);
      res.status(500).json({ error: "Failed to complete settlement" });
    }
  }
);

// Get individual balance for a user in a group
router.get("/groups/:id/my-balance", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;

  try {
    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: "Access denied to this group" });
    }

    // Get group phase
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("phase")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.phase === "settlement") {
      // Get from individual_balances table
      const { data: balance, error: balanceError } = await supabaseAdmin
        .from("individual_balances")
        .select("*")
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .single();

      if (balanceError && balanceError.code !== "PGRST116") {
        // PGRST116 is "not found"
        return res.status(400).json({ error: "Failed to fetch balance" });
      }

      res.json({
        balance: balance?.net_amount || 0,
        phase: "settlement",
      });
    } else {
      // Calculate from expense_settlements (active phase)
      const { data: settlements, error: settlementsError } = await supabaseAdmin
        .from("expense_settlements")
        .select("*")
        .eq("group_id", groupId)
        .or(`debtor_id.eq.${userId},creditor_id.eq.${userId}`);

      if (settlementsError) {
        return res.status(400).json({ error: "Failed to fetch settlements" });
      }

      let netBalance = 0;
      settlements.forEach((settlement) => {
        if (settlement.debtor_id === userId) {
          netBalance -= settlement.amount;
        } else if (settlement.creditor_id === userId) {
          netBalance += settlement.amount;
        }
      });

      res.json({
        balance: netBalance,
        phase: "active",
      });
    }
  } catch (err) {
    console.error("❌ Error fetching individual balance:", err);
    res.status(500).json({ error: "Failed to fetch individual balance" });
  }
});

module.exports = router;
