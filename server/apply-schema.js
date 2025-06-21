require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabaseClient');

async function applySchemaFix() {
  try {
    console.log('🔧 Applying schema fix...');
    
    // Read and execute the SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('./fix-group-members-schema.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement.trim()
        });
        
        if (error) {
          console.log('Statement result:', error.message);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Schema fix completed!');
    
  } catch (err) {
    console.error('❌ Error applying schema fix:', err);
  }
}

applySchemaFix();
