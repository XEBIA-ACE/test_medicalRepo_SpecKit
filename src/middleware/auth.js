/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No authorization header provided'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid authorization header format. Use "Bearer <token>"'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret);

    // Add user info to request object
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      error: 'Server error',
      message: 'Error processing authentication'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  // Use regular auth middleware if token is provided
  authMiddleware(req, res, next);
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Generate JWT token (utility function for testing)
 */
const generateToken = (payload, expiresIn = '24h') => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  generateToken
};

// Export default middleware
module.exports = authMiddleware;