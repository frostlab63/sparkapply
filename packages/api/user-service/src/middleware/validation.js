const { body, param, query, validationResult } = require('express-validator');
const { sanitizers } = require('../utils/validation');

/**
 * Validation middleware for different endpoints
 */

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters')
    .custom(async (value) => {
      // Additional email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
    
  body('role')
    .optional()
    .isIn(['job_seeker', 'employer', 'institution'])
    .withMessage('Role must be one of: job_seeker, employer, institution'),
    
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
  body('termsAccepted')
    .isBoolean()
    .withMessage('Terms acceptance must be a boolean')
    .custom((value) => {
      if (value !== true) {
        throw new Error('You must accept the terms and conditions');
      }
      return true;
    }),
    
  handleValidationErrors,
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password must be less than 128 characters'),
    
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean'),
    
  handleValidationErrors,
];

// Password reset request validation
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  handleValidationErrors,
];

// Password reset validation
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Invalid reset token format'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
    
  handleValidationErrors,
];

// Change password validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
    
  handleValidationErrors,
];

// Email verification validation
const validateEmailVerification = [
  query('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Invalid verification token format'),
    
  handleValidationErrors,
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
    
  body('location')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
    
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
    
  body('website')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid website URL'),
    
  body('linkedin')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid LinkedIn URL')
    .custom((value) => {
      if (value && !value.includes('linkedin.com')) {
        throw new Error('LinkedIn URL must be from linkedin.com');
      }
      return true;
    }),
    
  body('github')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid GitHub URL')
    .custom((value) => {
      if (value && !value.includes('github.com')) {
        throw new Error('GitHub URL must be from github.com');
      }
      return true;
    }),
    
  body('skills')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Skills must be an array with maximum 50 items'),
    
  body('skills.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters'),
    
  body('experience_level')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage('Experience level must be one of: entry, mid, senior, executive'),
    
  body('job_preferences.desired_roles')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Desired roles must be an array with maximum 20 items'),
    
  body('job_preferences.industries')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Industries must be an array with maximum 20 items'),
    
  body('job_preferences.work_arrangement')
    .optional()
    .isIn(['remote', 'hybrid', 'on_site', 'flexible'])
    .withMessage('Work arrangement must be one of: remote, hybrid, on_site, flexible'),
    
  body('job_preferences.salary_min')
    .optional()
    .isInt({ min: 0, max: 10000000 })
    .withMessage('Minimum salary must be between 0 and 10,000,000'),
    
  body('job_preferences.salary_max')
    .optional()
    .isInt({ min: 0, max: 10000000 })
    .withMessage('Maximum salary must be between 0 and 10,000,000')
    .custom((value, { req }) => {
      if (value && req.body.job_preferences?.salary_min && value < req.body.job_preferences.salary_min) {
        throw new Error('Maximum salary must be greater than minimum salary');
      }
      return true;
    }),
    
  handleValidationErrors,
];

// File upload validation
const validateFileUpload = [
  body('fileType')
    .optional()
    .isIn(['resume', 'cover_letter', 'portfolio', 'certificate'])
    .withMessage('File type must be one of: resume, cover_letter, portfolio, certificate'),
    
  handleValidationErrors,
];

// Two-factor authentication validation
const validateTwoFactorSetup = [
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
    
  handleValidationErrors,
];

// Email change validation
const validateEmailChange = [
  body('newEmail')
    .isEmail()
    .withMessage('Please provide a valid new email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
    
  body('password')
    .notEmpty()
    .withMessage('Current password is required for email change'),
    
  handleValidationErrors,
];

// ID parameter validation
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
    
  handleValidationErrors,
];

// UUID parameter validation
const validateUuidParam = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
    
  handleValidationErrors,
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'name', 'email'])
    .withMessage('Sort field must be one of: created_at, updated_at, name, email'),
    
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
    
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validatePasswordChange,
  validateEmailVerification,
  validateProfileUpdate,
  validateFileUpload,
  validateTwoFactorSetup,
  validateEmailChange,
  validateIdParam,
  validateUuidParam,
  validatePagination,
  handleValidationErrors,
};
