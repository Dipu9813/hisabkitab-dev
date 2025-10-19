// Load environment variables
require("dotenv").config();

const { supabaseAdmin } = require("./utils/supabaseClient");

async function createPushSubscriptionsTable() {
  console.log("🔄 Creating push_subscriptions table...");

  try {
    // Create the push_subscriptions table using direct query
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id")
      .limit(1);

    // If table doesn't exist, we'll get an error
    if (error && error.message.includes("does not exist")) {
      console.log(
        "⚠️ Table doesn't exist. Please create it manually in Supabase:"
      );
      console.log(`
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  subscription_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" 
ON push_subscriptions FOR ALL 
USING (auth.uid() = user_id);
      `);
      return false;
    } else if (error) {
      console.error("❌ Error checking push_subscriptions table:", error);
      return false;
    }

    console.log("✅ push_subscriptions table already exists");
    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return false;
  }
}

async function addReminderColumns() {
  console.log("🔄 Checking reminder columns in loans table...");

  try {
    // Check if the column exists by trying to select it
    const { error } = await supabaseAdmin
      .from("loans")
      .select("last_reminder_sent")
      .limit(1);

    if (error && error.message.includes("does not exist")) {
      console.log(
        "⚠️ Column doesn't exist. Please add it manually in Supabase:"
      );
      console.log(`
ALTER TABLE loans 
ADD COLUMN last_reminder_sent TIMESTAMP WITH TIME ZONE;
      `);
      return false;
    } else if (error) {
      console.error("❌ Error checking reminder columns:", error);
      return false;
    }

    console.log("✅ Reminder columns already exist");
    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return false;
  }
}

async function main() {
  console.log("🚀 Setting up push notifications infrastructure...");

  const success1 = await createPushSubscriptionsTable();
  const success2 = await addReminderColumns();

  if (success1 && success2) {
    console.log("✅ Push notifications setup completed successfully!");
  } else {
    console.log("❌ Push notifications setup failed!");
    process.exit(1);
  }
}

// Run only if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { createPushSubscriptionsTable, addReminderColumns };
