const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../utils/supabaseClient");
const authenticateToken = require("../middleware/authenticateToken");
const { sendPushNotification } = require("../utils/pushNotifications");

// Subscribe to push notifications
router.post("/subscribe", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const subscription = req.body;

  console.log("📱 User subscribing to push notifications:", userId);
  console.log("📱 Subscription endpoint:", subscription.endpoint);

  try {
    // First, let's see what columns exist in the table
    const { data: existingRecord, error: selectError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .limit(1);

    if (selectError) {
      console.error("❌ Error checking table structure:", selectError);
    } else {
      console.log("📋 Table structure sample:", existingRecord);
    }

    // Try a simple insert with just user_id and subscription
    const subscriptionRecord = {
      user_id: userId,
      subscription: subscription,
    };

    console.log("📝 Attempting to insert:", subscriptionRecord);

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("push_subscriptions")
      .insert(subscriptionRecord)
      .select();

    if (insertError) {
      console.error("❌ Error inserting subscription:", insertError);

      // If insert fails, try to update existing record for this user
      console.log("📝 Attempting to update existing record...");

      const { data: updateData, error: updateError } = await supabaseAdmin
        .from("push_subscriptions")
        .update({
          subscription: subscription,
        })
        .eq("user_id", userId)
        .select();

      if (updateError) {
        console.error("❌ Error updating subscription:", updateError);
        return res.status(400).json({
          error: "Failed to save subscription",
          details: updateError.message,
        });
      }

      console.log("✅ Subscription updated successfully");
      return res.json({
        message: "Subscription updated successfully",
        data: updateData,
      });
    }

    console.log("✅ Subscription saved successfully");
    res.json({ message: "Subscription saved successfully", data: insertData });
  } catch (err) {
    console.error("❌ Error in push subscription:", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// Unsubscribe from push notifications
router.post("/unsubscribe", authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const subscription = req.body;

  console.log("📱 User unsubscribing from push notifications:", userId);

  try {
    // Delete all subscriptions for this user (since we can't match by endpoint)
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("❌ Error removing subscription:", error);
      return res.status(400).json({ error: "Failed to remove subscription" });
    }

    console.log("✅ Subscription removed successfully");
    res.json({ message: "Subscription removed successfully", data });
  } catch (err) {
    console.error("❌ Error in push unsubscription:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test push notification (for development)
router.post("/api/push/test", authenticateToken, async (req, res) => {
  const userId = req.user.sub;

  try {
    // Get user's subscription
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: "No push subscription found" });
    }

    // Send test notification to all user's subscriptions
    const testPayload = {
      title: "🧪 Test Notification",
      body: "This is a test push notification from HisabKitab!",
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      data: {
        type: "test",
        url: "/",
      },
    };

    const promises = subscriptions.map((sub) =>
      sendPushNotification(sub.subscription, testPayload)
    );

    await Promise.all(promises);

    res.json({ message: "Test notification sent successfully" });
  } catch (err) {
    console.error("❌ Error sending test notification:", err);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

module.exports = router;
