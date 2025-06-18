const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/authenticateToken');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
    try {
    // Use supabaseAdmin to bypass RLS policies for profile retrieval
    const { data, error } = await supabaseAdmin
      .from('details')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (!data) {
      return res.json({ 
        data: { 
          id: userId,
          email: req.user.email,
          full_name: req.user.email.split('@')[0], // Default name from email
          ph_number: '',
          profile_pic: null
        } 
      });
    }
    
    // Rename profile_url to profile_pic for consistency with frontend
    if (data.profile_url) {
      data.profile_pic = data.profile_url;
      delete data.profile_url;
    }
    
    res.json({ data });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// User profile update: ph_number, full_name, and profile_pic
router.post('/profile', authenticateToken, async (req, res) => {
  const { ph_number, full_name, profile_pic } = req.body;
  const userId = req.user.sub;
  if (!ph_number || !full_name) {
    return res.status(400).json({ error: 'ph_number and full_name are required' });
  }  // Get user email from JWT
  const email = req.user.email;
  
  try {
    // Use supabaseAdmin to bypass RLS policies for profile update
    const { data, error } = await supabaseAdmin
      .from('details')
      .upsert({ id: userId, ph_number, full_name, profile_url: profile_pic, email })
      .select();
    
    if (error) {
      console.error("Profile update error:", error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: 'Profile updated', data });
  } catch (err) {
    console.error("Server error during profile update:", err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Profile picture upload endpoint
router.post('/profile/upload', authenticateToken, async (req, res) => {
  if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  const userId = req.user.sub;
  const file = req.files?.profile_pic;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;
  
  try {
    // Use supabaseAdmin to bypass RLS policies for file upload
    const { data, error } = await supabaseAdmin.storage.from('profile-pics').upload(filePath, file.data, {
      contentType: file.mimetype,
      upsert: true,
    });
      if (error) {
      console.error("Profile pic upload error:", error);
      return res.status(400).json({ error: error.message });
    }
    
    const { data: publicUrlData } = supabaseAdmin.storage.from('profile-pics').getPublicUrl(filePath);
    res.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Server error during profile picture upload:", err);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
  res.json({ url: publicUrlData.publicUrl });
});

module.exports = router;
