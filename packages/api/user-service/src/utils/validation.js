const { body, param, query, validationResult } = require('express-validator');

// Common validation rules
const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  confirmPassword: body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  firstName: body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),

  lastName: body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),

  phone: body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  role: body('role')
    .optional()
    .isIn(['job_seeker', 'employer', 'institution'])
    .withMessage('Role must be one of: job_seeker, employer, institution'),

  userId: param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

  token: param('token')
    .isLength({ min: 1 })
    .withMessage('Token is required'),

  location: body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters'),

  bio: body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),

  yearsExperience: body('yearsExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),

  salaryExpectation: body('salaryExpectation')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Salary expectation must be a positive number'),

  url: (field) => body(field)
    .optional()
    .isURL()
    .withMessage(`${field} must be a valid URL`),

  skills: body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
    .custom((skills) => {
      if (skills && skills.length > 0) {
        for (const skill of skills) {
          if (!skill.name || typeof skill.name !== 'string') {
            throw new Error('Each skill must have a name');
          }
          if (skill.level && !['beginner', 'intermediate', 'advanced', 'expert'].includes(skill.level)) {
            throw new Error('Skill level must be one of: beginner, intermediate, advanced, expert');
          }
        }
      }
      return true;
    }),

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
};

// Validation rule sets for different endpoints
const validationSets = {
  register: [
    validationRules.email,
    validationRules.password,
    validationRules.confirmPassword,
    validationRules.role,
  ],

  login: [
    validationRules.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],

  forgotPassword: [
    validationRules.email,
  ],

  resetPassword: [
    validationRules.token,
    validationRules.password,
    validationRules.confirmPassword,
  ],

  verifyEmail: [
    validationRules.token,
  ],

  updateProfile: [
    validationRules.firstName,
    validationRules.lastName,
    validationRules.phone,
    validationRules.location,
    validationRules.bio,
    validationRules.yearsExperience,
    validationRules.salaryExpectation,
    validationRules.url('linkedinUrl'),
    validationRules.url('githubUrl'),
    validationRules.url('portfolioUrl'),
    validationRules.skills,
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    validationRules.password,
    validationRules.confirmPassword,
  ],

  getUserById: [
    validationRules.userId,
  ],

  searchUsers: [
    ...validationRules.pagination,
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search query must not be empty'),
    query('role')
      .optional()
      .isIn(['job_seeker', 'employer', 'institution'])
      .withMessage('Role must be one of: job_seeker, employer, institution'),
  ],
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

// Custom validators
const customValidators = {
  isStrongPassword: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  },

  isValidRole: (role) => {
    return ['job_seeker', 'employer', 'institution', 'admin'].includes(role);
  },

  isValidSkillLevel: (level) => {
    return ['beginner', 'intermediate', 'advanced', 'expert'].includes(level);
  },

  isValidAvailability: (availability) => {
    return ['immediately', 'within_2_weeks', 'within_month', 'not_looking'].includes(availability);
  },
};

// Sanitization helpers
const sanitizers = {
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/\s+/g, ' ');
  },

  sanitizeEmail: (email) => {
    if (typeof email !== 'string') return email;
    return email.toLowerCase().trim();
  },

  sanitizePhone: (phone) => {
    if (typeof phone !== 'string') return phone;
    return phone.replace(/\D/g, '');
  },

  sanitizeUrl: (url) => {
    if (typeof url !== 'string') return url;
    url = url.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  },
};

module.exports = {
  validationRules,
  validationSets,
  handleValidationErrors,
  customValidators,
  sanitizers,
};
