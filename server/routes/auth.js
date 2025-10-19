const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "http://localhost:3001/login"
    }
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Registration successful. Please check your email to confirm.', data });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Login successful', session: data.session });
});

// Logout (client should just delete token, but endpoint for completeness)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;
