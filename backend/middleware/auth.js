/* ==========================================================================
   FLEVA — Authentication Middleware
   ========================================================================== */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — requires a valid JWT access token.
 * Attaches req.user with the full user document.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (user.isLocked) {
      return res.status(403).json({ success: false, message: 'Account is locked. Contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block if not.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (err) {
    // Silently ignore — user is just not authenticated
  }
  next();
};

/**
 * Role-based access control.
 * Usage: authorize('admin', 'superadmin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.error(`Authorize failed! user: ${req.user ? req.user.role : 'null'}, expected: ${roles.join(',')}`);
      return res.status(403).json({ success: false, message: 'Forbidden — insufficient permissions' });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };
