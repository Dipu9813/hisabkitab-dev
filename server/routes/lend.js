const express = require("express");
const router = express.Router();
const { supabase, supabaseAdmin } = require("../utils/supabaseClient");
const authenticateToken = require("../middleware/authenticateToken");

// Lend money route
router.post("/lend", authenticateToken, async (req, res) => {
  const { ph_number, amount, remark, deadline } = req.body;
  const lenderId = req.user.sub;

  console.log("💰 Loan creation request:", {
    ph_number,
    amount,
    remark,
    deadline,
    lenderId,
  });

  if (!ph_number || !amount || !deadline) {
    return res
      .status(400)
      .json({ error: "Phone number, amount, and deadline are required" });
  }

  try {
    // Find receiver by phone number
    console.log("🔍 Looking up receiver by phone:", ph_number);
    const { data: receiverData, error: receiverError } = await supabaseAdmin
      .from("details")
      .select("id")
      .eq("ph_number", ph_number)
      .single();

    if (receiverError || !receiverData) {
      console.log("❌ Receiver not found:", receiverError?.message);
      return res.status(404).json({ error: "Receiver not found" });
    }

    const receiverId = receiverData.id;
    console.log("✅ Receiver found:", receiverId);

    // Insert loan record (using due_date instead of deadline)
    console.log("📝 Creating loan record...");
    const { data, error } = await supabaseAdmin
      .from("loans")
      .insert([
        {
          lender_id: lenderId,
          receiver_id: receiverId,
          amount,
          reason: remark, // Using 'reason' field from schema
          due_date: deadline, // Fixed: deadline -> due_date
          status: "pending",
        },
      ])
      .select();

    if (error) {
      console.log("❌ Loan creation error:", error);
      return res.status(400).json({ error: error.message });
    }
    console.log("✅ Loan created successfully:", data);
    res.json({ message: "Loan request created", data });
  } catch (err) {
    console.error("❌ Unexpected error in loan creation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}); // Added missing closing brace and parenthesis

// Get all loans for the logged-in user (as lender or receiver)
router.get("/loans", authenticateToken, async (req, res) => {
  const userId = req.user.sub;

  console.log("📋 Fetching loans for user:", userId);

  try {
    // First, get basic loan data
    const { data: loans, error } = await supabaseAdmin
      .from("loans")
      .select("*")
      .or(`lender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("❌ Loans query error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Found loans:", loans?.length || 0);

    // Then fetch user details for each unique user ID
    const userIds = new Set();
    loans.forEach((loan) => {
      userIds.add(loan.lender_id);
      userIds.add(loan.receiver_id);
    });

    const { data: userDetails, error: userError } = await supabaseAdmin
      .from("details")
      .select("id, full_name, ph_number")
      .in("id", Array.from(userIds));

    if (userError) {
      console.log("⚠️ User details error:", userError.message);
      // Continue without user details
    }

    // Create user lookup map
    const userMap = {};
    userDetails?.forEach((user) => {
      userMap[user.id] = user;
    });
    // Enrich loans with user details
    const enrichedLoans = loans.map((loan) => ({
      ...loan,
      lender: userMap[loan.lender_id] || null,
      receiver: userMap[loan.receiver_id] || null,
    }));

    console.log("✅ Loans with user details prepared");
    res.json({ data: enrichedLoans });
  } catch (err) {
    console.error("❌ Error fetching loans:", err);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

// Receiver confirms the loan
router.post("/loans/:id/confirm", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const loanId = req.params.id;

  try {
    // Only receiver can confirm
    const { data: loan, error: loanError } = await supabaseAdmin
      .from("loans")
      .select("*")
      .eq("id", loanId)
      .single();

    if (loanError || !loan)
      return res.status(404).json({ error: "Loan not found" });
    if (loan.receiver_id !== userId)
      return res.status(403).json({ error: "Not authorized" });

    const { data, error } = await supabaseAdmin
      .from("loans")
      .update({ status: "confirmed" })
      .eq("id", loanId)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Loan confirmed", data });
  } catch (err) {
    console.error("Error confirming loan:", err);
    res.status(500).json({ error: "Failed to confirm loan" });
  }
});

// Borrower requests loan payment confirmation
router.post(
  "/loans/:id/payment-request",
  authenticateToken,
  async (req, res) => {
    const userId = req.user.sub;
    const loanId = req.params.id;

    try {
      // Only the borrower/receiver can request payment confirmation
      const { data: loan, error: loanError } = await supabaseAdmin
        .from("loans")
        .select("*")
        .eq("id", loanId)
        .single();

      if (loanError || !loan)
        return res.status(404).json({ error: "Loan not found" });
      if (loan.receiver_id !== userId)
        return res
          .status(403)
          .json({
            error:
              "Not authorized - only borrowers can request payment confirmation",
          });
      if (loan.status !== "confirmed")
        return res
          .status(400)
          .json({ error: "Only confirmed loans can have payment requests" });

      const { data, error } = await supabaseAdmin
        .from("loans")
        .update({ status: "payment_requested" })
        .eq("id", loanId)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      res.json({ message: "Payment request submitted", data });
    } catch (err) {
      console.error("Error requesting payment confirmation:", err);
      res.status(500).json({ error: "Failed to submit payment request" });
    }
  }
);

// Lender confirms payment receipt
router.post(
  "/loans/:id/confirm-payment",
  authenticateToken,
  async (req, res) => {
    const userId = req.user.sub;
    const loanId = req.params.id;

    try {
      // Only the lender can confirm payment
      const { data: loan, error: loanError } = await supabaseAdmin
        .from("loans")
        .select("*")
        .eq("id", loanId)
        .single();

      if (loanError || !loan)
        return res.status(404).json({ error: "Loan not found" });
      if (loan.lender_id !== userId)
        return res
          .status(403)
          .json({
            error: "Not authorized - only lenders can confirm payments",
          });
      if (loan.status !== "payment_requested")
        return res
          .status(400)
          .json({
            error:
              "Only loans with pending payment requests can be confirmed as paid",
          });
      // Insert into loan history
      const { data: historyData, error: historyError } = await supabaseAdmin
        .from("loan_history")
        .insert([
          {
            original_loan_id: loan.id,
            lender_id: loan.lender_id,
            receiver_id: loan.receiver_id,
            amount: loan.amount,
            reason: loan.reason, // Fixed: remark -> reason
            due_date: loan.due_date, // Fixed: deadline -> due_date
            created_at: loan.created_at,
            paid_at: new Date().toISOString(),
          },
        ])
        .select();

      if (historyError) {
        console.error("Error creating history record:", historyError);
        return res
          .status(400)
          .json({ error: "Failed to record payment history" });
      }

      // Delete from active loans
      const { data, error } = await supabaseAdmin
        .from("loans")
        .delete()
        .eq("id", loanId)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      res.json({
        message: "Payment confirmed and loan marked as paid",
        data: historyData,
      });
    } catch (err) {
      console.error("Error confirming payment:", err);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  }
);

// Get loan history
router.get("/loan-history", authenticateToken, async (req, res) => {
  const userId = req.user.sub;

  console.log("📊 Fetching loan history for user:", userId);

  try {
    // Query loan history and manually join with details
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from("loan_history")
      .select("*")
      .or(`lender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("paid_at", { ascending: false }); // Fixed: payment_date -> paid_at

    if (historyError) {
      console.error("❌ History query error:", historyError);
      return res.status(400).json({ error: historyError.message });
    }

    console.log("✅ Found loan history records:", historyData?.length || 0);

    // Get all unique user IDs from the history data
    const userIds = [
      ...new Set([
        ...historyData.map((item) => item.lender_id),
        ...historyData.map((item) => item.receiver_id),
      ]),
    ];

    // Fetch user details for all involved users
    let userDetails = {};
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from("details")
        .select("id, full_name, ph_number")
        .in("id", userIds);

      if (!usersError && usersData) {
        usersData.forEach((user) => {
          userDetails[user.id] = user;
        });
      }
    }

    // Combine the data
    const enrichedData = historyData.map((item) => ({
      ...item,
      lender: userDetails[item.lender_id] || null,
      receiver: userDetails[item.receiver_id] || null,
    }));

    res.json({ data: enrichedData });
  } catch (err) {
    console.error("Error fetching loan history:", err);
    res.status(500).json({ error: "Failed to fetch loan history" });
  }
});

module.exports = router;
