const jwtService = require('../utils/jwt');
const { User } = require('../models');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'MISSING_TOKEN',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token
    const decoded = jwtService.verifyAccessToken(token);
    
    // Find the user
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified,
    };
    
    req.token = {
      jti: decoded.jti,
      exp: decoded.exp,
      iat: decoded.iat,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    let message = 'Invalid or expired token';
    let errorCode = 'INVALID_TOKEN';
    
    if (error.message.includes('expired')) {
      message = 'Token has expired';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.message.includes('malformed')) {
      message = 'Malformed token';
      errorCode = 'MALFORMED_TOKEN';
    }
    
    return res.status(401).json({
      success: false,
      message,
      error: errorCode,
    });
  }
};

/**
 * Middleware to check if user is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED',
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'EMAIL_NOT_VERIFIED',
    });
  }

  next();
};

/**
 * Middleware to check user roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED',
      });
    }

    const resourceUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (resourceUserId !== currentUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only access your own resources',
        error: 'ACCESS_DENIED',
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwtService.verifyAccessToken(token);
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      };
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

/**
 * Middleware to refresh token if it's about to expire
 */
const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    if (!req.token || !req.user) {
      return next();
    }

    const tokenExp = req.token.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = tokenExp - now;
    const fiveMinutes = 5 * 60 * 1000;

    // If token expires in less than 5 minutes, include a new token in response
    if (timeUntilExpiry < fiveMinutes) {
      const newTokens = jwtService.generateTokenPair({
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
      });

      // Add new tokens to response headers
      res.set({
        'X-New-Access-Token': newTokens.accessToken,
        'X-New-Refresh-Token': newTokens.refreshToken,
        'X-Token-Refreshed': 'true',
      });
    }

    next();
  } catch (error) {
    // Don't fail the request if token refresh fails
    console.error('Token refresh error:', error);
    next();
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});

/**
 * General rate limiting middleware
 */
const generalRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
});

module.exports = {
  authenticate,
  requireVerified,
  requireRole,
  requireOwnershipOrAdmin,
  optionalAuth,
  refreshTokenIfNeeded,
  authRateLimit,
  generalRateLimit,
};
