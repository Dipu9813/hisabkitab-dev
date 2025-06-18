const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('🔍 Auth check for:', req.method, req.path);
  console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.SUPABASE_JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    
    console.log('✅ Token verified for user:', user.sub);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
