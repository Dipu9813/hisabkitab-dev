require("dotenv").config();
const { supabaseAdmin } = require("./utils/supabaseClient");

async function checkMigration() {
  console.log("🔍 Checking if migration has been applied...");
  // Try to select customer_user_id from business_loans to see if column exists
  const { data: loans, error: columnError } = await supabaseAdmin
    .from("business_loans")
    .select("id, customer_name, customer_user_id")
    .limit(1);
  if (columnError) {
    if (columnError.message.includes("customer_user_id")) {
      console.log("❌ customer_user_id column does NOT exist");
      console.log("⚠️ Migration has NOT been applied yet!");
      console.log(
        "📝 Please run the migration SQL in your Supabase dashboard:"
      );
      console.log("   - Open Supabase Dashboard > SQL Editor");
      console.log(
        "   - Copy and paste business-schema-migration-customer-linking.sql"
      );
      console.log("   - Execute the SQL");
      return;
    } else {
      console.log("❌ Error checking columns:", columnError.message);
      return;
    }
  }

  console.log("✅ customer_user_id column exists");
  console.log("✅ Migration has been applied");

  // Check existing business loans
  console.log("📊 Sample business loans:");
  loans.forEach((loan) => {
    console.log(
      `  - ${loan.customer_name}: user_id = ${loan.customer_user_id || "NULL"}`
    );
  });

  const nullUserIds = loans.filter((loan) => !loan.customer_user_id).length;
  if (nullUserIds > 0) {
    console.log(
      `⚠️ Found ${nullUserIds} business loans without customer_user_id`
    );
    console.log(
      "💡 You may need to update existing loans to link them to users"
    );
  }
}

checkMigration().catch(console.error);
