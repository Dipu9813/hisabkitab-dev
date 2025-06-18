const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('Error: SUPABASE_URL is required in the .env file');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('Error: SUPABASE_ANON_KEY is required in the .env file');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is required in the .env file');
  process.exit(1);
}

// Check if service key is the same as anon key (temporary setup)
if (supabaseServiceKey === supabaseAnonKey) {
  console.warn('⚠️ Warning: You are using SUPABASE_ANON_KEY as your service key.');
  console.warn('⚠️ This will not bypass RLS policies. For full functionality:');
  console.warn('⚠️ 1. Go to Supabase dashboard > Project Settings > API');
  console.warn('⚠️ 2. Find "service_role key" (this has admin privileges)');
  console.warn('⚠️ 3. Update your .env file with the actual service key');
}

// Create regular client with anon key for public operations
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Create an admin client that bypasses RLS
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey, // Service role key bypasses RLS policies
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = { supabase, supabaseAdmin };
