require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabaseClient');

async function addQrCodeColumn() {
  try {
    console.log('🔧 Adding qr_code_pic column to details table...');
    
    // Check if column already exists
    const { data: columns, error: checkError } = await supabaseAdmin
      .rpc('get_columns', { table_name: 'details' });
    
    if (checkError) {
      console.log('⚠️ Could not check existing columns, proceeding with ALTER TABLE...');
    } else {
      const hasQrColumn = columns && columns.some(col => col.column_name === 'qr_code_pic');
      if (hasQrColumn) {
        console.log('✅ qr_code_pic column already exists!');
        return;
      }
    }
    
    // Add the column
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE details ADD COLUMN IF NOT EXISTS qr_code_pic TEXT;`
    });
    
    if (error) {
      console.error('❌ Error adding column:', error.message);
      
      // Try alternative approach using raw SQL
      const { error: altError } = await supabaseAdmin
        .from('details')
        .select('qr_code_pic')
        .limit(1);
        
      if (altError && altError.message.includes('column "qr_code_pic" does not exist')) {
        console.log('🔧 Column definitely does not exist. You may need to add it manually in Supabase dashboard.');
        console.log('SQL to run: ALTER TABLE details ADD COLUMN qr_code_pic TEXT;');
      } else {
        console.log('✅ Column seems to exist or was added successfully!');
      }
    } else {
      console.log('✅ qr_code_pic column added successfully!');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
    console.log('💡 You may need to manually add the column in Supabase dashboard:');
    console.log('   ALTER TABLE details ADD COLUMN qr_code_pic TEXT;');
  }
}

addQrCodeColumn().then(() => {
  console.log('🎉 Script completed!');
  process.exit(0);
});
