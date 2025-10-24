const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Auth middleware for Lambda functions
const authenticate = async (event) => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    return user;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Optional auth middleware (doesn't throw error if no token)
const optionalAuth = async (event) => {
  try {
    return await authenticate(event);
  } catch (error) {
    return null;
  }
};

// Admin auth middleware
const requireAdmin = async (event) => {
  const user = await authenticate(event);
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
};

// Refresh token
const refreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }
  
  return generateToken(userId);
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  requireAdmin,
  refreshToken
};
