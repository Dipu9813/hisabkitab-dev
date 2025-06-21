// Load environment variables first
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { supabaseAdmin } = require("./utils/supabaseClient");

async function applyBusinessSchema() {
  try {
    console.log("🏢 Starting business schema application...");

    // Read the schema file
    const schemaPath = path.join(__dirname, "business-schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    console.log("📖 Business schema file loaded");
    console.log(
      "🔍 Schema content preview:",
      schemaSQL.substring(0, 200) + "..."
    );

    // Execute the schema
    console.log("⚡ Executing business schema...");
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql: schemaSQL,
    });

    if (error) {
      console.error("❌ Error applying business schema:", error);

      // Try alternative method if rpc doesn't work
      console.log("🔄 Trying alternative method...");

      // Split SQL into individual statements
      const statements = schemaSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      console.log(`📝 Found ${statements.length} SQL statements to execute`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
          console.log(`📄 Statement: ${statement.substring(0, 80)}...`);

          try {
            const { error: stmtError } = await supabaseAdmin
              .from("_")
              .select("*")
              .limit(0);
            // This is a workaround - for production you'd use proper SQL execution
            console.log("⚠️ Cannot execute raw SQL through client library");
            console.log(
              "🔧 Please run the business-schema.sql file manually in your Supabase SQL editor"
            );
            break;
          } catch (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError);
          }
        }
      }
    } else {
      console.log("✅ Business schema applied successfully!");
      console.log("📊 Result:", data);
    }
  } catch (err) {
    console.error("❌ Failed to apply business schema:", err);
    console.log(
      "🔧 Please manually run the business-schema.sql file in your Supabase SQL editor"
    );
    console.log("📁 File location: ./business-schema.sql");
  }
}

// Instructions for manual application
function showManualInstructions() {
  console.log("\n📋 MANUAL SCHEMA APPLICATION INSTRUCTIONS:");
  console.log("1. Open your Supabase project dashboard");
  console.log("2. Go to the SQL Editor");
  console.log("3. Copy and paste the contents of business-schema.sql");
  console.log("4. Run the SQL script");
  console.log("5. Verify that the following tables are created:");
  console.log("   - businesses");
  console.log("   - business_members");
  console.log("   - business_loans");
  console.log("\n🔍 You can also check the table structure using:");
  console.log(
    "   SELECT * FROM information_schema.tables WHERE table_name LIKE 'business%';"
  );
}

if (require.main === module) {
  applyBusinessSchema().then(() => {
    showManualInstructions();
    process.exit(0);
  });
}

module.exports = { applyBusinessSchema };
