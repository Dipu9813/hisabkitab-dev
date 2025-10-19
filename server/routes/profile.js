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
          profile_pic: null,
          qr_code_pic: null
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

// User profile update: ph_number, full_name, profile_pic, and qr_code_pic
router.post('/profile', authenticateToken, async (req, res) => {
  const { ph_number, full_name, profile_pic, qr_code_pic } = req.body;
  const userId = req.user.sub;  if (!ph_number || !full_name) {
    return res.status(400).json({ error: 'ph_number and full_name are required' });
  }  
  console.log('🔍 Profile update request:', { userId, ph_number, full_name, profile_pic, qr_code_pic });

  try {
    // Use supabaseAdmin to bypass RLS policies for profile update
    const { data, error } = await supabaseAdmin
      .from('details')
      .upsert({ 
        id: userId, 
        ph_number, 
        full_name, 
        profile_pic,
        qr_code_pic // Added QR code picture field
      })
      .select();
    
    if (error) {
      console.error("Profile update error:", error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('✅ Profile updated successfully:', data);
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
});

// QR Code picture upload endpoint
router.post('/profile/qr-upload', authenticateToken, async (req, res) => {
  if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  
  const userId = req.user.sub;
  const file = req.files?.qr_code_pic;
  
  if (!file) {
    return res.status(400).json({ error: 'No QR code file uploaded' });
  }

  // Validate file type (images only)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }

  const fileExt = file.name.split('.').pop();
  const filePath = `qr-codes/${userId}/qr-${Date.now()}.${fileExt}`;
  
  try {
    // Use supabaseAdmin to bypass RLS policies for file upload
    const { data, error } = await supabaseAdmin.storage
      .from('profile-pics') // Using existing bucket for now
      .upload(filePath, file.data, {
        contentType: file.mimetype,
        upsert: true,
      });
      
    if (error) {
      console.error("QR code upload error:", error);
      return res.status(400).json({ error: error.message });
    }
    
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('profile-pics')
      .getPublicUrl(filePath);
    
    console.log('✅ QR code uploaded successfully:', publicUrlData.publicUrl);
    res.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Server error during QR code upload:", err);
    res.status(500).json({ error: 'Failed to upload QR code picture' });
  }
});

module.exports = router;
