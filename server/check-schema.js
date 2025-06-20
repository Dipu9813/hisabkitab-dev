// Check the current table structures
require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabaseClient');

async function checkTableStructures() {
  console.log('🔍 Checking table structures...');
  
  try {
    // Check group_members table structure
    const { data: groupMembersStructure, error: gmError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'group_members' });
    
    if (gmError) {
      console.log('ℹ️  Cannot get group_members structure via RPC, trying direct query...');
      
      // Try a different approach - check if there's a foreign key
      const { data: fkInfo, error: fkError } = await supabaseAdmin
        .from('group_members')
        .select('*')
        .limit(1);
        
      if (!fkError && fkInfo.length > 0) {
        console.log('✅ group_members table exists with columns:', Object.keys(fkInfo[0]));
      }
    }
    
    // Check details table structure  
    const { data: detailsStructure, error: detailsError } = await supabaseAdmin
      .from('details')
      .select('*')
      .limit(1);
        
    if (!detailsError && detailsStructure.length > 0) {
      console.log('✅ details table exists with columns:', Object.keys(detailsStructure[0]));
    }
    
    // Try to manually join the tables to see if it works
    console.log('🔍 Testing manual join...');
    const { data: manualJoin, error: joinError } = await supabaseAdmin
      .from('group_members')
      .select(`
        user_id,
        joined_at
      `)
      .eq('group_id', 'fa2cc945-b390-453b-90c0-6c7616b58911');
      
    if (joinError) {
      console.error('❌ Manual join failed:', joinError);
    } else {
      console.log('✅ Manual join successful, got', manualJoin.length, 'members');
      
      // Now try to get details for these users
      if (manualJoin.length > 0) {
        const userIds = manualJoin.map(m => m.user_id);
        const { data: userDetails, error: userError } = await supabaseAdmin
          .from('details')
          .select('id, full_name, ph_number, profile_pic')
          .in('id', userIds);
          
        if (userError) {
          console.error('❌ User details fetch failed:', userError);
        } else {
          console.log('✅ User details fetched successfully:', userDetails.length, 'users');
          
          // Manually combine the data
          const combinedData = manualJoin.map(member => ({
            user_id: member.user_id,
            joined_at: member.joined_at,
            details: userDetails.find(d => d.id === member.user_id)
          }));
          
          console.log('🎯 Manually combined data:', JSON.stringify(combinedData, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkTableStructures().then(() => {
  console.log('🏁 Table structure check completed');
  process.exit(0);
});
