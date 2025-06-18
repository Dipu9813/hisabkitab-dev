const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/authenticateToken');

// Get all users (id, full_name, and ph_number)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching users from database...');
    
    const { data, error } = await supabaseAdmin
      .from('details')
      .select('id, full_name, ph_number')
      .not('ph_number', 'is', null); // Only return users with phone numbers
      
    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Raw data from database:', data?.length, 'users found');
      // Filter out any users with empty or null values
    const validUsers = data.filter(user => {
      if (!user.id) return false;
      if (!user.ph_number) return false;
      
      // Handle both string and number phone numbers
      const phoneStr = String(user.ph_number);
      return phoneStr.trim() !== '' && phoneStr !== 'null' && phoneStr !== 'undefined';
    }).map(user => ({
      ...user,
      ph_number: String(user.ph_number) // Convert phone number to string for consistency
    }));
    
    console.log('Valid users after filtering:', validUsers.length);
    console.log('Sample user:', validUsers[0]);
    
    res.json({ data: validUsers });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
