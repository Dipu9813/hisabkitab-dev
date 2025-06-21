const express = require("express");
const router = express.Router();
const { supabase, supabaseAdmin } = require("../utils/supabaseClient");
const authenticateToken = require("../middleware/authenticateToken");

// Get all users (id, full_name, and ph_number)
router.get("/users", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 Fetching users from database...");

    const { data, error } = await supabaseAdmin
      .from("details")
      .select("id, full_name, ph_number")
      .not("ph_number", "is", null); // Only return users with phone numbers

    if (error) {
      console.error("Database error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("Raw data from database:", data?.length, "users found");
    // Filter out any users with empty or null values
    const validUsers = data
      .filter((user) => {
        if (!user.id) return false;
        if (!user.ph_number) return false;

        // Handle both string and number phone numbers
        const phoneStr = String(user.ph_number);
        return (
          phoneStr.trim() !== "" &&
          phoneStr !== "null" &&
          phoneStr !== "undefined"
        );
      })
      .map((user) => ({
        ...user,
        ph_number: String(user.ph_number), // Convert phone number to string for consistency
      }));

    console.log("Valid users after filtering:", validUsers.length);
    console.log("Sample user:", validUsers[0]);

    res.json({ data: validUsers });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Search users by name or phone number for customer selection
router.get("/users/search", authenticateToken, async (req, res) => {
  const { q: query } = req.query;

  try {
    console.log("🔍 Searching users with query:", query);

    if (!query || query.trim().length < 2) {
      return res.json({ data: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search in both full_name and ph_number
    const { data, error } = await supabaseAdmin
      .from("details")
      .select("id, full_name, ph_number")
      .or(`full_name.ilike.%${searchTerm}%,ph_number.ilike.%${searchTerm}%`)
      .not("ph_number", "is", null)
      .limit(10) // Limit results for better performance
      .order("full_name");

    if (error) {
      console.error("Search error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Filter and format results
    const validUsers = data
      .filter((user) => {
        if (!user.id || !user.ph_number) return false;

        const phoneStr = String(user.ph_number);
        return (
          phoneStr.trim() !== "" &&
          phoneStr !== "null" &&
          phoneStr !== "undefined"
        );
      })
      .map((user) => ({
        id: user.id,
        full_name: user.full_name || "Unknown",
        ph_number: String(user.ph_number),
        // Create a display text for the dropdown
        display_text: `${user.full_name || "Unknown"} (${user.ph_number})`,
      }));

    console.log("✅ Search results:", validUsers.length, "users found");
    res.json({ data: validUsers });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Failed to search users" });
  }
});

module.exports = router;
