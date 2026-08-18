// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==========================================
// 1. PROTECT: Checks if the user is logged in
// ==========================================
exports.protect = async (req, res, next) => {
  let token;

  // Check if the frontend sent the token in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token (it looks like: "Bearer eyJhbGci...")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "workwave_super_secret_key_123");

      // Find the user in the database and attach them to the request object
      // We use .select('-password') so we don't send the scrambled password back
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      // Move to the next step (the actual route controller)
      next(); 
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token is invalid or expired" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// ==========================================
// 2. ADMIN ONLY: Checks if the logged-in user is an Admin
// ==========================================
exports.adminOnly = (req, res, next) => {
  // If the user exists and their role is 'admin', let them through
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // If they are a regular worker, block them!
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
};