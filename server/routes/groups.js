const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/authenticateToken');

// Create a new group
router.post('/groups', authenticateToken, async (req, res) => {
  const { name, memberPhones } = req.body;
  const creatorId = req.user.sub;
  
  console.log('🔍 Group Creation Request:', {
    name,
    memberPhones,
    creatorId,
    userObject: req.user
  });
  
  if (!name || !memberPhones || !Array.isArray(memberPhones)) {
    console.log('❌ Validation failed:', { name, memberPhones });
    return res.status(400).json({ error: 'Group name and member phone numbers are required' });
  }
  
  try {
    console.log('🔍 Finding users by phone numbers:', memberPhones);
    
    // Find all users by phone numbers
    const { data: users, error: usersError } = await supabaseAdmin
      .from('details')
      .select('id, ph_number, full_name')
      .in('ph_number', memberPhones);
      
    if (usersError) {
      console.error('❌ Users query error:', usersError);
      return res.status(400).json({ error: 'Failed to find users by phone numbers' });
    }
    
    console.log('✅ Found users:', users?.length, users);
    
    // Check if all phone numbers were found
    const foundPhones = users.map(u => String(u.ph_number)); // Convert to string for comparison
    const notFoundPhones = memberPhones.filter(phone => !foundPhones.includes(String(phone)));
    
    if (notFoundPhones.length > 0) {
      console.log('❌ Some users not found:', notFoundPhones);
      return res.status(404).json({ 
        error: `Users not found for phone numbers: ${notFoundPhones.join(', ')}` 
      });
    }
    
    console.log('🔍 Creating group...');    // Create the group
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert([{
        name,
        creator_id: creatorId,
      }])
      .select()
      .single();
      
    if (groupError) {
      console.error('❌ Group creation error:', groupError);
      return res.status(400).json({ error: 'Failed to create group: ' + groupError.message });
    }
    
    console.log('✅ Group created:', group);
    
    // Add members to the group (including creator)
    const memberIds = users.map(u => u.id);
    if (!memberIds.includes(creatorId)) {
      memberIds.push(creatorId);
    }
    
    const groupMembers = memberIds.map(memberId => ({
      group_id: group.id,
      user_id: memberId,
      joined_at: new Date().toISOString()
    }));
    
    const { data: members, error: membersError } = await supabaseAdmin
      .from('group_members')
      .insert(groupMembers)
      .select();
      
    if (membersError) {
      return res.status(400).json({ error: 'Failed to add group members' });
    }
    
    res.json({ 
      message: 'Group created successfully', 
      group: group,
      members: members 
    });
    
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get user's groups
router.get('/groups', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  
  try {
    const { data: userGroups, error } = await supabaseAdmin
      .from('group_members')
      .select(`
        groups (
          id,
          name,
          creator_id,
          created_at
        )
      `)
      .eq('user_id', userId);
      
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const groups = userGroups.map(ug => ug.groups);
    res.json({ data: groups });
    
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details with members
router.get('/groups/:id', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;
  
  try {
    // Check if user is a member of this group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to this group' });
    }
    
    // Get group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
      
    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get group members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select(`
        user_id,
        joined_at,
        details (
          full_name,
          ph_number,
          profile_pic
        )
      `)
      .eq('group_id', groupId);
      
    if (membersError) {
      return res.status(400).json({ error: 'Failed to fetch group members' });
    }
    
    res.json({ 
      group: group,
      members: members 
    });
    
  } catch (err) {
    console.error("Error fetching group details:", err);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// Send message to group
router.post('/groups/:id/messages', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;
  const { message } = req.body;
  
  console.log('💬 Message send attempt:');
  console.log('   User ID:', userId);
  console.log('   Group ID:', groupId);
  console.log('   Message:', message);
  
  if (!message || message.trim() === '') {
    console.log('❌ Empty message rejected');
    return res.status(400).json({ error: 'Message content is required' });
  }
  
  try {
    // Check if user is a member of this group
    console.log('🔍 Checking group membership...');
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
      
    console.log('📋 Membership check result:', membership ? 'Found' : 'Not found');
    if (membershipError) {
      console.log('❌ Membership error:', membershipError.message);
    }
      
    if (membershipError || !membership) {
      console.log('🚫 Access denied - user not a member');
      return res.status(403).json({ error: 'Access denied to this group' });
    }    // Insert message
    console.log('📝 Inserting message into database...');
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('group_messages')
      .insert([{
        group_id: groupId,
        sender_id: userId,
        message: message.trim(),
        sent_at: new Date().toISOString()
      }])
      .select('*')
      .single();
      
    if (messageError) {
      console.log('❌ Message insert error:', messageError.message);
      console.log('❌ Full error details:', messageError);
      return res.status(400).json({ error: `Failed to send message: ${messageError.message}` });
    }    // Fetch user details separately
    console.log('🔍 Fetching user details for sender:', userId);
    const { data: userDetails, error: userError } = await supabaseAdmin
      .from('details')
      .select('full_name, profile_pic')
      .eq('id', userId)
      .single();
    
    console.log('👤 User details query result:', userDetails);
    console.log('❌ User details error:', userError);
    
    if (!userError && userDetails) {
      newMessage.details = userDetails;
      console.log('✅ Added user details to message:', userDetails);
    } else {
      console.log('⚠️ No user details found for sender:', userId);
    }
    
    console.log('✅ Message sent successfully');
    res.json({ 
      message: 'Message sent successfully',
      data: newMessage 
    });
    
  } catch (err) {
    console.error("❌ Unexpected error sending message:", err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get group messages
router.get('/groups/:id/messages', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.id;
  const { limit = 20, offset = 0 } = req.query;
  
  console.log('🔍 Fetching messages for group:', groupId, 'user:', userId);
  
  try {
    // Check if user is a member of this group
    console.log('🔍 Checking group membership...');
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      console.log('❌ Membership check failed:', membershipError?.message || 'No membership found');
      return res.status(403).json({ error: 'Access denied to this group' });
    }
      console.log('✅ User is member of group');
    
    // Get messages with basic query first
    console.log('🔍 Fetching messages...');
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('sent_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
    if (messagesError) {
      console.error('❌ Messages query failed:', messagesError);
      return res.status(400).json({ error: 'Failed to fetch messages: ' + messagesError.message });
    }
      // Fetch user details for each message
    console.log('🔍 Fetching user details for messages...');
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        console.log('👤 Looking up user details for sender:', message.sender_id);
        const { data: userDetails, error: userError } = await supabaseAdmin
          .from('details')
          .select('full_name, profile_pic')
          .eq('id', message.sender_id)
          .single();
        
        console.log('👤 User details for', message.sender_id, ':', userDetails);
        if (userError) console.log('❌ User lookup error:', userError.message);
        
        return {
          ...message,
          details: userError ? null : userDetails
        };
      })
    );
    
    console.log('✅ Messages with details prepared:', messagesWithDetails?.length || 0);
    
    res.json({ data: messagesWithDetails.reverse() }); // Reverse to show oldest first
    
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
