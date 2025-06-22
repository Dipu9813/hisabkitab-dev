const express = require("express");
const router = express.Router();
const { supabase, supabaseAdmin } = require("../utils/supabaseClient");
const authenticateToken = require("../middleware/authenticateToken");
const {
  generateShortBusinessId,
  isValidBusinessId,
  normalizeBusinessId,
} = require("../utils/businessIdUtils");

// Create a new business
router.post("/business/create", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const creatorId = req.user.sub;

  console.log("🏢 Business Creation Request:", {
    name,
    creatorId,
  });

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Business name is required" });
  }

  try {
    let attempts = 0;
    let businessId = null;
    let business = null;
    const maxAttempts = 5;

    // Try to generate a unique business ID
    while (attempts < maxAttempts) {
      businessId = generateShortBusinessId();
      console.log(
        `🔍 Attempt ${attempts + 1}: Generated business ID: ${businessId}`
      );

      // Check if this ID already exists
      const { data: existingBusiness, error: checkError } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("unique_short_id", businessId)
        .single();

      if (checkError && checkError.code === "PGRST116") {
        // ID doesn't exist, we can use it
        console.log("✅ Business ID is unique");
        break;
      } else if (checkError) {
        console.error("❌ Error checking business ID uniqueness:", checkError);
        return res
          .status(500)
          .json({ error: "Failed to generate business ID" });
      } else {
        // ID exists, try again
        console.log("⚠️ Business ID already exists, trying again");
        attempts++;
        businessId = null;
      }
    }

    if (!businessId) {
      return res.status(500).json({
        error: "Failed to generate unique business ID after multiple attempts",
      });
    }

    // Create the business
    const { data: newBusiness, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert([
        {
          name: name.trim(),
          unique_short_id: businessId,
          created_by: creatorId,
        },
      ])
      .select()
      .single();

    if (businessError) {
      console.error("❌ Business creation error:", businessError);
      return res
        .status(400)
        .json({ error: "Failed to create business: " + businessError.message });
    }

    business = newBusiness;
    console.log("✅ Business created:", business);    // Auto-join the creator as a member with owner role
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("business_members")
      .insert([
        {
          business_id: business.id,
          user_id: creatorId,
          role: 'owner' // Creator gets owner role
        },
      ])
      .select()
      .single();

    if (memberError) {
      console.error("❌ Failed to add creator as member:", memberError);
      // Try to clean up the business
      await supabaseAdmin.from("businesses").delete().eq("id", business.id);
      return res
        .status(400)
        .json({ error: "Failed to add creator as business member" });
    }

    console.log("✅ Creator auto-joined as member");

    res.json({
      message: "Business created successfully",
      business: {
        id: business.id,
        name: business.name,
        businessId: business.unique_short_id,
        createdBy: business.created_by,
        createdAt: business.created_at,
      },
    });
  } catch (err) {
    console.error("❌ Error creating business:", err);
    res.status(500).json({ error: "Failed to create business" });
  }
});

// Join an existing business by business ID
router.post("/business/join", authenticateToken, async (req, res) => {
  const { businessId } = req.body;
  const userId = req.user.sub;

  console.log("🤝 Business Join Request:", {
    businessId,
    userId,
  });

  if (!businessId) {
    return res.status(400).json({ error: "Business ID is required" });
  }

  const normalizedBusinessId = normalizeBusinessId(businessId);

  if (!isValidBusinessId(normalizedBusinessId)) {
    return res.status(400).json({
      error: "Invalid business ID format. Must be 6 alphanumeric characters.",
    });
  }

  try {
    // Check if business exists
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("unique_short_id", normalizedBusinessId)
      .single();

    if (businessError || !business) {
      console.log("❌ Business not found:", normalizedBusinessId);
      return res
        .status(404)
        .json({ error: "Business not found. Please check the business ID." });
    }

    console.log("✅ Business found:", business.name);

    // Check if user is already a member
    const { data: existingMembership, error: membershipCheckError } =
      await supabaseAdmin
        .from("business_members")
        .select("*")
        .eq("business_id", business.id)
        .eq("user_id", userId)
        .single();

    if (existingMembership) {
      console.log("⚠️ User already a member");
      return res
        .status(400)
        .json({ error: "You are already a member of this business" });
    }

    if (membershipCheckError && membershipCheckError.code !== "PGRST116") {
      console.error("❌ Error checking membership:", membershipCheckError);
      return res
        .status(500)
        .json({ error: "Failed to check membership status" });
    }    // Add user as member
    const { data: newMembership, error: joinError } = await supabaseAdmin
      .from("business_members")
      .insert([        {
          business_id: business.id,
          user_id: userId,
          role: 'member' // Default role for joining users
        },
      ])
      .select()
      .single();

    if (joinError) {
      console.error("❌ Failed to join business:", joinError);
      return res
        .status(400)
        .json({ error: "Failed to join business: " + joinError.message });
    }

    console.log("✅ User joined business successfully");

    res.json({
      message: "Successfully joined business",
      business: {
        id: business.id,
        name: business.name,
        businessId: business.unique_short_id,
        joinedAt: newMembership.joined_at,
      },
    });
  } catch (err) {
    console.error("❌ Error joining business:", err);
    res.status(500).json({ error: "Failed to join business" });
  }
});

// Get user's businesses
router.get("/business/my-businesses", authenticateToken, async (req, res) => {
  const userId = req.user.sub;

  try {
    console.log("📋 Fetching businesses for user:", userId);

    // First, let's check if the business tables exist
    const { data: testQuery, error: testError } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("❌ Business tables don't exist or RLS error:", testError);

      if (testError.code === "42P01") {
        return res.status(400).json({
          error:
            "Business tables not found. Please apply the business-schema.sql first.",
          details:
            "Run the SQL schema in your Supabase dashboard to create the business tables.",
        });
      }

      return res.status(400).json({
        error: "Database error: " + testError.message,
        code: testError.code,
      });
    }

    console.log("✅ Business tables exist, proceeding with query");

    const { data: memberships, error } = await supabaseAdmin
      .from("business_members")
      .select(
        `
        business_id,
        joined_at,
        businesses (
          id,
          name,
          unique_short_id,
          created_by,
          created_at
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Error fetching businesses:", error);
      return res.status(400).json({ error: error.message });
    }

    const businesses = memberships.map((membership) => ({
      id: membership.businesses.id,
      name: membership.businesses.name,
      businessId: membership.businesses.unique_short_id,
      createdBy: membership.businesses.created_by,
      createdAt: membership.businesses.created_at,
      joinedAt: membership.joined_at,
      isOwner: membership.businesses.created_by === userId,
    }));

    console.log("✅ Found businesses:", businesses.length);
    res.json({ data: businesses });
  } catch (err) {
    console.error("❌ Error fetching businesses:", err);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

// Add a loan/credit entry for a customer under a business
router.post("/business/loan", authenticateToken, async (req, res) => {
  const { businessId, customerName, customerUserId, amount, description } =
    req.body;
  const userId = req.user.sub;

  console.log("💰 Business Loan Request:", {
    businessId,
    customerName,
    customerUserId,
    amount,
    description,
    userId,
  });

  // Validation
  if (!businessId || !customerName || !amount) {
    return res.status(400).json({
      error: "Business ID, customer name, and amount are required",
    });
  }

  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  try {
    // Verify user is a member of the business
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("business_members")
      .select("business_id")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      console.log("❌ User not a member of business:", businessId);
      return res
        .status(403)
        .json({ error: "You are not a member of this business" });
    }

    console.log("✅ User is member of business");

    // If customerUserId is provided, validate that the user exists
    if (customerUserId) {
      const { data: customerUser, error: customerError } = await supabaseAdmin
        .from("details")
        .select("id, full_name, ph_number")
        .eq("id", customerUserId)
        .single();

      if (customerError || !customerUser) {
        console.log("❌ Customer user not found:", customerUserId);
        return res
          .status(400)
          .json({ error: "Selected customer user not found" });
      }

      console.log("✅ Customer user validated:", customerUser.full_name);
    }

    // Create the loan entry
    const { data: loan, error: loanError } = await supabaseAdmin
      .from("business_loans")
      .insert([
        {
          business_id: businessId,
          added_by_user_id: userId,
          customer_name: customerName.trim(),
          customer_user_id: customerUserId || null,
          amount: parseFloat(amount),
          description: description ? description.trim() : null,
          is_paid: false,
        },
      ])
      .select(
        `
        *,
        details!business_loans_added_by_user_id_fkey (
          full_name
        )
      `
      )
      .single();

    if (loanError) {
      console.error("❌ Failed to create loan:", loanError);
      return res
        .status(400)
        .json({ error: "Failed to create loan: " + loanError.message });
    }

    console.log("✅ Loan created successfully");

    res.json({
      message: "Loan added successfully",
      loan: {
        id: loan.id,
        businessId: loan.business_id,
        customerName: loan.customer_name,
        customerUserId: loan.customer_user_id,
        amount: loan.amount,
        description: loan.description,
        isPaid: loan.is_paid,
        date: loan.date,
        addedBy: loan.details?.full_name || "Unknown",
        addedById: loan.added_by_user_id,
      },
    });
  } catch (err) {
    console.error("❌ Error creating business loan:", err);
    res.status(500).json({ error: "Failed to create loan" });
  }
});

// Get loans for a specific business
router.get(
  "/business/:businessId/loans",
  authenticateToken,
  async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.sub;
    const { limit = 50, offset = 0, isPaid } = req.query;

    try {
      console.log("📋 Fetching loans for business:", businessId);

      // Verify user is a member of the business
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from("business_members")
        .select("business_id")
        .eq("business_id", businessId)
        .eq("user_id", userId)
        .single();

      if (membershipError || !membership) {
        return res
          .status(403)
          .json({ error: "You are not a member of this business" });
      }

      // Build query
      let query = supabaseAdmin
        .from("business_loans")
        .select(
          `
        *,
        details!business_loans_added_by_user_id_fkey (
          full_name,
          profile_pic
        )
      `
        )
        .eq("business_id", businessId)
        .order("date", { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Filter by payment status if specified
      if (isPaid !== undefined) {
        query = query.eq("is_paid", isPaid === "true");
      }

      const { data: loans, error: loansError } = await query;

      if (loansError) {
        console.error("❌ Error fetching loans:", loansError);
        return res.status(400).json({ error: "Failed to fetch loans" });
      }

      const formattedLoans = loans.map((loan) => ({
        id: loan.id,
        businessId: loan.business_id,
        customerName: loan.customer_name,
        amount: loan.amount,
        description: loan.description,
        isPaid: loan.is_paid,
        date: loan.date,
        addedBy: loan.details?.full_name || "Unknown",
        addedById: loan.added_by_user_id,
        addedByProfilePic: loan.details?.profile_pic,
      }));

      console.log("✅ Found loans:", formattedLoans.length);
      res.json({ data: formattedLoans });
    } catch (err) {
      console.error("❌ Error fetching business loans:", err);
      res.status(500).json({ error: "Failed to fetch loans" });
    }
  }
);

// Mark a loan as paid/unpaid
router.patch(
  "/business/loan/:loanId/status",
  authenticateToken,
  async (req, res) => {
    const { loanId } = req.params;
    const { isPaid } = req.body;
    const userId = req.user.sub;

    if (typeof isPaid !== "boolean") {
      return res.status(400).json({ error: "isPaid must be a boolean value" });
    }

    try {
      console.log("🔄 Updating loan status:", { loanId, isPaid, userId });

      // Get the loan and verify user has permission
      const { data: loan, error: loanError } = await supabaseAdmin
        .from("business_loans")
        .select(
          `
        *,
        business_members!inner(user_id)
      `
        )
        .eq("id", loanId)
        .eq("business_members.user_id", userId)
        .single();

      if (loanError || !loan) {
        console.log("❌ Loan not found or access denied");
        return res
          .status(404)
          .json({ error: "Loan not found or access denied" });
      }

      // Update the loan status
      const { data: updatedLoan, error: updateError } = await supabaseAdmin
        .from("business_loans")
        .update({ is_paid: isPaid, updated_at: new Date().toISOString() })
        .eq("id", loanId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Failed to update loan:", updateError);
        return res.status(400).json({ error: "Failed to update loan status" });
      }

      console.log("✅ Loan status updated");

      res.json({
        message: `Loan marked as ${isPaid ? "paid" : "unpaid"}`,
        loan: {
          id: updatedLoan.id,
          customerName: updatedLoan.customer_name,
          amount: updatedLoan.amount,
          isPaid: updatedLoan.is_paid,
          updatedAt: updatedLoan.updated_at,
        },
      });
    } catch (err) {
      console.error("❌ Error updating loan status:", err);
      res.status(500).json({ error: "Failed to update loan status" });
    }
  }
);

// Get business details with members
router.get(
  "/business/:businessId/details",
  authenticateToken,
  async (req, res) => {
    const { businessId } = req.params;
    const userId = req.user.sub;

    try {
      // Verify user is a member and get business details
      const { data: businessData, error: businessError } = await supabaseAdmin
        .from("business_members")
        .select(
          `
        joined_at,
        businesses (
          id,
          name,
          unique_short_id,
          created_by,
          created_at
        )
      `
        )
        .eq("business_id", businessId)
        .eq("user_id", userId)
        .single();

      if (businessError || !businessData) {
        return res
          .status(403)
          .json({ error: "Business not found or access denied" });
      }

      const business = businessData.businesses;

      // Get all members
      const { data: members, error: membersError } = await supabaseAdmin
        .from("business_members")
        .select(
          `
        user_id,
        joined_at,
        details (
          full_name,
          ph_number,
          profile_pic
        )
      `
        )
        .eq("business_id", businessId);

      if (membersError) {
        console.error("❌ Error fetching members:", membersError);
        return res
          .status(400)
          .json({ error: "Failed to fetch business members" });
      }

      const formattedMembers = members.map((member) => ({
        userId: member.user_id,
        fullName: member.details?.full_name || "Unknown",
        phoneNumber: member.details?.ph_number,
        profilePic: member.details?.profile_pic,
        joinedAt: member.joined_at,
        isOwner: member.user_id === business.created_by,
      }));

      res.json({
        business: {
          id: business.id,
          name: business.name,
          businessId: business.unique_short_id,
          createdBy: business.created_by,
          createdAt: business.created_at,
          isOwner: business.created_by === userId,
        },
        members: formattedMembers,
      });
    } catch (err) {
      console.error("❌ Error fetching business details:", err);
      res.status(500).json({ error: "Failed to fetch business details" });
    }
  }
);

// Mark business loan as paid (for customers)
router.post(
  "/business-loans/:loanId/mark-paid",
  authenticateToken,
  async (req, res) => {
    const { loanId } = req.params;
    const userId = req.user.sub;

    console.log("💰 Marking business loan as paid:", {
      loanId,
      userId,
    });

    try {
      // First, get the loan and verify the user can mark it as paid
      const { data: loan, error: loanError } = await supabaseAdmin
        .from("business_loans")
        .select(
          `
          *,
          businesses!inner (
            name,
            unique_short_id
          )
        `
        )
        .eq("id", loanId)
        .single();

      if (loanError || !loan) {
        console.log("❌ Business loan not found:", loanId);
        return res.status(404).json({ error: "Business loan not found" });
      }

      // Check if the current user can mark this loan as paid
      // Either the customer (if linked by user ID) or a business member can mark it as paid
      const isCustomer = loan.customer_user_id === userId;

      // Check if user is a business member
      let isBusinessMember = false;
      if (!isCustomer) {
        const { data: membership } = await supabaseAdmin
          .from("business_members")
          .select("*")
          .eq("business_id", loan.business_id)
          .eq("user_id", userId)
          .single();

        isBusinessMember = !!membership;
      }

      if (!isCustomer && !isBusinessMember) {
        console.log("❌ User not authorized to mark this loan as paid");
        return res.status(403).json({
          error: "You are not authorized to mark this loan as paid",
        });
      }

      // Check if loan is already paid
      if (loan.is_paid) {
        console.log("⚠️ Loan already marked as paid");
        return res
          .status(400)
          .json({ error: "Loan is already marked as paid" });
      }

      // Mark the loan as paid
      const { data: updatedLoan, error: updateError } = await supabaseAdmin
        .from("business_loans")
        .update({
          is_paid: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating business loan:", updateError);
        return res.status(500).json({ error: "Failed to mark loan as paid" });
      }

      console.log("✅ Business loan marked as paid:", updatedLoan.id);
      res.json({
        message: "Business loan marked as paid successfully",
        loan: updatedLoan,
      });    } catch (err) {
      console.error("❌ Error marking business loan as paid:", err);
      res.status(500).json({ error: "Failed to mark business loan as paid" });
    }
  }
);

// Get business members (for business owner or members)
router.get("/business/:businessId/members", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;

  console.log("👥 Get business members request:", { businessId, userId });

  try {
    // Verify user is a member of the business
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ 
        error: "Access denied. You must be a member of this business." 
      });
    }

    // Get business details to check if user is the owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const isOwner = business.created_by === userId;
    
    console.log("🔍 Ownership check:", {
      businessId,
      userId,
      createdBy: business.created_by,
      isOwner,
      businessName: business.name
    });    // Get all business members with their details
    const { data: members, error: membersError } = await supabaseAdmin
      .from("business_members")
      .select(`
        user_id,
        joined_at,
        role,
        details:user_id (
          id,
          full_name,
          ph_number,
          profile_pic
        )
      `)
      .eq("business_id", businessId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("❌ Error fetching business members:", membersError);
      return res.status(400).json({ error: "Failed to fetch business members" });
    }    // Enrich member data with role information
    const enrichedMembers = members.map(member => ({
      user_id: member.user_id,
      joined_at: member.joined_at,
      role: member.role,
      is_owner: member.user_id === business.created_by,
      details: member.details
    }));

    res.json({
      business: {
        id: businessId,
        name: business.name,
        is_owner: isOwner
      },
      members: enrichedMembers
    });

  } catch (err) {
    console.error("❌ Error fetching business members:", err);
    res.status(500).json({ error: "Failed to fetch business members" });
  }
});

// Add member to business (business owner only)
router.post("/business/:businessId/members", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;
  const { phone_number } = req.body;

  console.log("➕ Add business member request:", { businessId, userId, phone_number });

  if (!phone_number) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    // Verify user is the business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by !== userId) {
      return res.status(403).json({ 
        error: "Access denied. Only the business owner can add members." 
      });
    }

    // Find user by phone number
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from("details")
      .select("id, full_name, ph_number")
      .eq("ph_number", phone_number)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ 
        error: "User not found with the provided phone number" 
      });
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("user_id", targetUser.id)
      .single();

    if (existingMembership) {
      return res.status(400).json({ 
        error: "User is already a member of this business" 
      });
    }

    if (membershipCheckError && membershipCheckError.code !== "PGRST116") {
      console.error("❌ Error checking membership:", membershipCheckError);
      return res.status(500).json({ error: "Failed to check membership status" });
    }    // Add user as business member
    const { data: newMembership, error: addMemberError } = await supabaseAdmin
      .from("business_members")
      .insert([
        {
          business_id: businessId,
          user_id: targetUser.id,
          role: 'member' // Default role for added members
        }
      ])
      .select()
      .single();

    if (addMemberError) {
      console.error("❌ Error adding business member:", addMemberError);
      return res.status(400).json({ error: "Failed to add member to business" });
    }

    console.log("✅ Member added successfully:", newMembership);    res.json({
      message: "Member added successfully",
      member: {        user_id: targetUser.id,
        full_name: targetUser.full_name,
        phone_number: targetUser.ph_number,
        joined_at: newMembership.joined_at,
        role: newMembership.role || 'member',
        is_owner: false
      }
    });

  } catch (err) {
    console.error("❌ Error adding business member:", err);
    res.status(500).json({ error: "Failed to add business member" });
  }
});

// Remove member from business (business owner only)
router.delete("/business/:businessId/members/:memberId", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;
  const memberId = req.params.memberId;

  console.log("➖ Remove business member request:", { businessId, userId, memberId });

  try {
    // Verify user is the business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by !== userId) {
      return res.status(403).json({ 
        error: "Access denied. Only the business owner can remove members." 
      });
    }

    // Prevent owner from removing themselves
    if (memberId === userId) {
      return res.status(400).json({ 
        error: "Business owner cannot remove themselves. Transfer ownership first or delete the business." 
      });
    }

    // Check if the member exists
    const { data: memberToRemove, error: memberCheckError } = await supabaseAdmin
      .from("business_members")
      .select(`
        *,
        details:user_id (
          full_name,
          ph_number
        )
      `)
      .eq("business_id", businessId)
      .eq("user_id", memberId)
      .single();

    if (memberCheckError || !memberToRemove) {
      return res.status(404).json({ 
        error: "Member not found in this business" 
      });
    }

    // Remove the member
    const { error: removeError } = await supabaseAdmin
      .from("business_members")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", memberId);

    if (removeError) {
      console.error("❌ Error removing business member:", removeError);
      return res.status(400).json({ error: "Failed to remove member from business" });
    }

    console.log("✅ Member removed successfully:", memberId);

    res.json({
      message: "Member removed successfully",
      removed_member: {
        user_id: memberId,
        full_name: memberToRemove.details?.full_name,
        phone_number: memberToRemove.details?.ph_number
      }
    });

  } catch (err) {
    console.error("❌ Error removing business member:", err);
    res.status(500).json({ error: "Failed to remove business member" });
  }
});

// Update member role (business owner only)
router.patch("/business/:businessId/members/:memberId/role", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;
  const memberId = req.params.memberId;
  const { role } = req.body;

  console.log("🔄 Update member role request:", { businessId, userId, memberId, role });

  const validRoles = ['member', 'admin', 'viewer'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ 
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
    });
  }

  try {
    // Verify user is the business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by !== userId) {
      return res.status(403).json({ 
        error: "Access denied. Only the business owner can update member roles." 
      });
    }

    // Prevent changing owner's role
    if (memberId === userId) {
      return res.status(400).json({ 
        error: "Cannot change role of business owner" 
      });
    }

    // Check if the member exists
    const { data: memberToUpdate, error: memberCheckError } = await supabaseAdmin
      .from("business_members")
      .select(`
        *,
        details:user_id (
          full_name,
          ph_number
        )
      `)
      .eq("business_id", businessId)
      .eq("user_id", memberId)
      .single();

    if (memberCheckError || !memberToUpdate) {
      return res.status(404).json({ 
        error: "Member not found in this business" 
      });
    }

    // Update the member's role
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from("business_members")
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq("business_id", businessId)
      .eq("user_id", memberId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating member role:", updateError);
      return res.status(400).json({ error: "Failed to update member role" });
    }

    console.log("✅ Member role updated successfully:", updatedMember);

    res.json({
      message: "Member role updated successfully",
      member: {
        user_id: memberId,
        full_name: memberToUpdate.details?.full_name,
        phone_number: memberToUpdate.details?.ph_number,
        role: role,
        updated_at: updatedMember.updated_at
      }
    });  } catch (err) {
    console.error("❌ Error updating member role:", err);
    res.status(500).json({ error: "Failed to update member role" });
  }
});

// Remove member from business (business owner only)
router.delete("/business/:businessId/members/:memberId", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;
  const memberId = req.params.memberId;

  console.log("➖ Remove business member request:", { businessId, userId, memberId });

  try {
    // Verify user is the business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by !== userId) {
      return res.status(403).json({ 
        error: "Access denied. Only the business owner can remove members." 
      });
    }

    // Prevent owner from removing themselves
    if (memberId === userId) {
      return res.status(400).json({ 
        error: "Business owner cannot remove themselves. Transfer ownership first or delete the business." 
      });
    }

    // Check if the member exists
    const { data: memberToRemove, error: memberCheckError } = await supabaseAdmin
      .from("business_members")
      .select(`
        *,
        details:user_id (
          full_name,
          ph_number
        )
      `)
      .eq("business_id", businessId)
      .eq("user_id", memberId)
      .single();

    if (memberCheckError || !memberToRemove) {
      return res.status(404).json({ 
        error: "Member not found in this business" 
      });
    }

    // Remove the member
    const { error: removeError } = await supabaseAdmin
      .from("business_members")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", memberId);

    if (removeError) {
      console.error("❌ Error removing business member:", removeError);
      return res.status(400).json({ error: "Failed to remove member from business" });
    }

    console.log("✅ Member removed successfully:", memberId);

    res.json({
      message: "Member removed successfully",
      removed_member: {
        user_id: memberId,
        full_name: memberToRemove.details?.full_name,
        phone_number: memberToRemove.details?.ph_number
      }
    });

  } catch (err) {
    console.error("❌ Error removing business member:", err);
    res.status(500).json({ error: "Failed to remove business member" });
  }
});

// Leave business (for business members)
router.post("/business/:businessId/leave", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;

  console.log("🚪 Leave business request:", { businessId, userId });

  try {
    // Verify user is a member of the business
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("business_members")
      .select("*")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({ 
        error: "You are not a member of this business" 
      });
    }

    // Check if user is the business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by === userId) {
      return res.status(400).json({ 
        error: "Business owner cannot leave the business. Transfer ownership first or delete the business." 
      });
    }

    // Remove the user from business members
    const { error: leaveError } = await supabaseAdmin
      .from("business_members")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", userId);

    if (leaveError) {
      console.error("❌ Error leaving business:", leaveError);
      return res.status(400).json({ error: "Failed to leave business" });
    }

    console.log("✅ User left business successfully:", userId);

    res.json({
      message: "Successfully left the business",
      business: {
        id: businessId,
        name: business.name
      }
    });

  } catch (err) {
    console.error("❌ Error leaving business:", err);
    res.status(500).json({ error: "Failed to leave business" });
  }
});

// Transfer ownership (business owner only)
router.post("/business/:businessId/transfer-ownership", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;
  const { new_owner_id } = req.body;

  console.log("👑 Transfer ownership request:", { businessId, userId, new_owner_id });

  if (!new_owner_id) {
    return res.status(400).json({ error: "New owner ID is required" });
  }

  try {
    // Verify user is the current business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by !== userId) {
      return res.status(403).json({ 
        error: "Access denied. Only the business owner can transfer ownership." 
      });
    }

    // Verify new owner is a member of the business
    const { data: newOwnerMembership, error: membershipError } = await supabaseAdmin
      .from("business_members")
      .select(`
        *,
        details:user_id (
          full_name,
          ph_number
        )
      `)
      .eq("business_id", businessId)
      .eq("user_id", new_owner_id)
      .single();

    if (membershipError || !newOwnerMembership) {
      return res.status(400).json({ 
        error: "New owner must be an existing member of the business" 
      });
    }

    // Update business owner
    const { error: updateError } = await supabaseAdmin
      .from("businesses")
      .update({ 
        created_by: new_owner_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", businessId);

    if (updateError) {
      console.error("❌ Error transferring ownership:", updateError);
      return res.status(400).json({ error: "Failed to transfer ownership" });
    }

    console.log("✅ Ownership transferred successfully");

    res.json({
      message: "Ownership transferred successfully",
      new_owner: {
        id: new_owner_id,
        name: newOwnerMembership.details.full_name,
        phone: newOwnerMembership.details.ph_number
      },
      business: {
        id: businessId,
        name: business.name
      }
    });

  } catch (err) {
    console.error("❌ Error transferring ownership:", err);
    res.status(500).json({ error: "Failed to transfer ownership" });
  }
});

// Bulk add members (business owner only)
router.post("/business/:businessId/members/bulk", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;
  const { phone_numbers, role = 'member' } = req.body;

  console.log("👥 Bulk add members request:", { businessId, userId, phone_numbers, role });

  if (!phone_numbers || !Array.isArray(phone_numbers) || phone_numbers.length === 0) {
    return res.status(400).json({ error: "Phone numbers array is required" });
  }

  if (phone_numbers.length > 50) {
    return res.status(400).json({ error: "Cannot add more than 50 members at once" });
  }

  try {
    // Verify user is the business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by !== userId) {
      return res.status(403).json({ 
        error: "Access denied. Only the business owner can add members." 
      });
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Process each phone number
    for (const phone_number of phone_numbers) {
      try {
        // Find user by phone number
        const { data: targetUser, error: userError } = await supabaseAdmin
          .from("details")
          .select("id, full_name, ph_number")
          .eq("ph_number", phone_number.trim())
          .single();

        if (userError || !targetUser) {
          results.failed.push({
            phone_number,
            error: "User not found"
          });
          continue;
        }

        // Check if user is already a member
        const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
          .from("business_members")
          .select("*")
          .eq("business_id", businessId)
          .eq("user_id", targetUser.id)
          .single();

        if (existingMembership) {
          results.skipped.push({
            phone_number,
            user_name: targetUser.full_name,
            reason: "Already a member"
          });
          continue;
        }

        if (membershipCheckError && membershipCheckError.code !== "PGRST116") {
          results.failed.push({
            phone_number,
            error: "Failed to check membership status"
          });
          continue;
        }        // Add user as business member
        const { data: newMembership, error: addMemberError } = await supabaseAdmin
          .from("business_members")
          .insert([
            {
              business_id: businessId,
              user_id: targetUser.id,
              role: role // Use the specified role
            }
          ])
          .select()
          .single();

        if (addMemberError) {
          results.failed.push({
            phone_number,
            error: "Failed to add as member"
          });
          continue;
        }

        results.successful.push({
          phone_number,
          user_id: targetUser.id,
          user_name: targetUser.full_name,
          role: role,
          joined_at: newMembership.joined_at
        });

      } catch (err) {
        results.failed.push({
          phone_number,
          error: "Unexpected error occurred"
        });
      }
    }

    console.log("✅ Bulk add completed:", results);

    res.json({
      message: "Bulk member addition completed",
      results: results,
      summary: {
        total: phone_numbers.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      }
    });

  } catch (err) {
    console.error("❌ Error in bulk add members:", err);
    res.status(500).json({ error: "Failed to process bulk member addition" });
  }
});

// Bulk remove members (business owner only)
router.delete("/business/:businessId/members/bulk", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const businessId = req.params.businessId;
  const { member_ids } = req.body;

  console.log("👥 Bulk remove members request:", { businessId, userId, member_ids });

  if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
    return res.status(400).json({ error: "Member IDs array is required" });
  }

  if (member_ids.length > 50) {
    return res.status(400).json({ error: "Cannot remove more than 50 members at once" });
  }

  try {
    // Verify user is the business owner
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("created_by, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (business.created_by !== userId) {
      return res.status(403).json({ 
        error: "Access denied. Only the business owner can remove members." 
      });
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Process each member ID
    for (const memberId of member_ids) {
      try {
        // Prevent owner from removing themselves
        if (memberId === userId) {
          results.skipped.push({
            member_id: memberId,
            reason: "Cannot remove business owner"
          });
          continue;
        }

        // Check if the member exists
        const { data: memberToRemove, error: memberCheckError } = await supabaseAdmin
          .from("business_members")
          .select(`
            *,
            details:user_id (
              full_name,
              ph_number
            )
          `)
          .eq("business_id", businessId)
          .eq("user_id", memberId)
          .single();

        if (memberCheckError || !memberToRemove) {
          results.failed.push({
            member_id: memberId,
            error: "Member not found in business"
          });
          continue;
        }

        // Remove the member
        const { error: removeError } = await supabaseAdmin
          .from("business_members")
          .delete()
          .eq("business_id", businessId)
          .eq("user_id", memberId);

        if (removeError) {
          results.failed.push({
            member_id: memberId,
            error: "Failed to remove member"
          });
          continue;
        }

        results.successful.push({
          member_id: memberId,
          user_name: memberToRemove.details?.full_name,
          phone_number: memberToRemove.details?.ph_number
        });

      } catch (err) {
        results.failed.push({
          member_id: memberId,
          error: "Unexpected error occurred"
        });
      }
    }

    console.log("✅ Bulk remove completed:", results);

    res.json({
      message: "Bulk member removal completed",
      results: results,
      summary: {
        total: member_ids.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      }
    });

  } catch (err) {
    console.error("❌ Error in bulk remove members:", err);
    res.status(500).json({ error: "Failed to process bulk member removal" });
  }
});

module.exports = router;
