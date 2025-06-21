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
    console.log("✅ Business created:", business);

    // Auto-join the creator as a member
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("business_members")
      .insert([
        {
          business_id: business.id,
          user_id: creatorId,
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
    }

    // Add user as member
    const { data: newMembership, error: joinError } = await supabaseAdmin
      .from("business_members")
      .insert([
        {
          business_id: business.id,
          user_id: userId,
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
      });
    } catch (err) {
      console.error("❌ Error marking business loan as paid:", err);
      res.status(500).json({ error: "Failed to mark business loan as paid" });
    }
  }
);

module.exports = router;
