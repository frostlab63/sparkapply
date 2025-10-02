const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware configurations for different endpoints
 */

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/v1/health';
  },
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Very strict rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email verification rate limiting
const emailVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // limit each IP to 3 verification email requests per 10 minutes
  message: {
    success: false,
    message: 'Too many verification email requests, please try again later.',
    error: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 10 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 file uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file upload attempts, please try again later.',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Profile update rate limiting
const profileUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 profile updates per 5 minutes
  message: {
    success: false,
    message: 'Too many profile update attempts, please try again later.',
    error: 'PROFILE_UPDATE_RATE_LIMIT_EXCEEDED',
    retryAfter: 5 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create account-specific rate limiter (by user ID)
const createAccountLimiter = (windowMs, max, message) => {
  const store = new Map();
  
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [k, v] of store.entries()) {
      if (v.resetTime < now) {
        store.delete(k);
      }
    }
    
    // Get or create user's request data
    let userData = store.get(key);
    if (!userData || userData.resetTime < now) {
      userData = {
        count: 0,
        resetTime: now + windowMs,
      };
      store.set(key, userData);
    }
    
    // Check if limit exceeded
    if (userData.count >= max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000),
      });
    }
    
    // Increment counter
    userData.count++;
    
    // Add rate limit headers
    res.set({
      'RateLimit-Limit': max,
      'RateLimit-Remaining': Math.max(0, max - userData.count),
      'RateLimit-Reset': new Date(userData.resetTime).toISOString(),
    });
    
    next();
  };
};

// Account-specific limiters
const accountAuthLimiter = createAccountLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 attempts per account
  'Too many authentication attempts for this account, please try again later.'
);

const accountPasswordResetLimiter = createAccountLimiter(
  60 * 60 * 1000, // 1 hour
  2, // 2 attempts per account
  'Too many password reset attempts for this account, please try again later.'
);

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  uploadLimiter,
  profileUpdateLimiter,
  accountAuthLimiter,
  accountPasswordResetLimiter,
  createAccountLimiter,
};
