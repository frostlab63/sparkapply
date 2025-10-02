const express = require('express');
const multer = require('multer');
const path = require('path');
const profileController = require('../controllers/profileController');
const { validationSets, handleValidationErrors } = require('../utils/validation');
const { authenticate, requireOwnershipOrAdmin, optionalAuth, generalRateLimit } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only PDF, DOC, and DOCX files
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * @route   GET /api/v1/profile/:userId?
 * @desc    Get user profile (own profile or public profiles)
 * @access  Public/Private
 */
router.get(
  '/:userId?',
  optionalAuth,
  generalRateLimit,
  profileController.getProfile
);

/**
 * @route   PUT /api/v1/profile/job-seeker
 * @desc    Update job seeker profile
 * @access  Private
 */
router.put(
  '/job-seeker',
  authenticate,
  generalRateLimit,
  validationSets.updateProfile,
  handleValidationErrors,
  profileController.updateJobSeekerProfile
);

/**
 * @route   POST /api/v1/profile/skills
 * @desc    Add skill to profile
 * @access  Private
 */
router.post(
  '/skills',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Skill name must be between 1 and 100 characters'),
    require('express-validator').body('level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Skill level must be one of: beginner, intermediate, advanced, expert'),
  ],
  handleValidationErrors,
  profileController.addSkill
);

/**
 * @route   DELETE /api/v1/profile/skills/:skillName
 * @desc    Remove skill from profile
 * @access  Private
 */
router.delete(
  '/skills/:skillName',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').param('skillName')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Skill name is required'),
  ],
  handleValidationErrors,
  profileController.removeSkill
);

/**
 * @route   POST /api/v1/profile/resume
 * @desc    Upload resume
 * @access  Private
 */
router.post(
  '/resume',
  authenticate,
  generalRateLimit,
  (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 5MB.',
            error: 'FILE_TOO_LARGE',
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: 'UPLOAD_ERROR',
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'INVALID_FILE_TYPE',
        });
      }
      next();
    });
  },
  profileController.uploadResume
);

/**
 * @route   GET /api/v1/profile/search
 * @desc    Search public profiles
 * @access  Public
 */
router.get(
  '/search',
  optionalAuth,
  generalRateLimit,
  validationSets.searchUsers,
  handleValidationErrors,
  profileController.searchProfiles
);

/**
 * @route   GET /api/v1/profile/stats
 * @desc    Get profile statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  generalRateLimit,
  profileController.getProfileStats
);

/**
 * @route   POST /api/v1/profile/experience
 * @desc    Add work experience
 * @access  Private
 */
router.post(
  '/experience',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Job title must be between 1 and 200 characters'),
    require('express-validator').body('company')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Company name must be between 1 and 200 characters'),
    require('express-validator').body('start_date')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    require('express-validator').body('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    require('express-validator').body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
  ],
  handleValidationErrors,
  profileController.addExperience
);

/**
 * @route   PUT /api/v1/profile/experience/:experienceId
 * @desc    Update work experience
 * @access  Private
 */
router.put(
  '/experience/:experienceId',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').param('experienceId')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Experience ID is required'),
  ],
  handleValidationErrors,
  profileController.updateExperience
);

/**
 * @route   DELETE /api/v1/profile/experience/:experienceId
 * @desc    Remove work experience
 * @access  Private
 */
router.delete(
  '/experience/:experienceId',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').param('experienceId')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Experience ID is required'),
  ],
  handleValidationErrors,
  profileController.removeExperience
);

/**
 * @route   POST /api/v1/profile/education
 * @desc    Add education
 * @access  Private
 */
router.post(
  '/education',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').body('degree')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Degree must be between 1 and 200 characters'),
    require('express-validator').body('institution')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Institution name must be between 1 and 200 characters'),
    require('express-validator').body('graduation_year')
      .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
      .withMessage('Graduation year must be a valid year'),
    require('express-validator').body('gpa')
      .optional()
      .isFloat({ min: 0, max: 4.0 })
      .withMessage('GPA must be between 0 and 4.0'),
  ],
  handleValidationErrors,
  profileController.addEducation
);

/**
 * @route   PUT /api/v1/profile/education/:educationId
 * @desc    Update education
 * @access  Private
 */
router.put(
  '/education/:educationId',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').param('educationId')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Education ID is required'),
  ],
  handleValidationErrors,
  profileController.updateEducation
);

/**
 * @route   DELETE /api/v1/profile/education/:educationId
 * @desc    Remove education
 * @access  Private
 */
router.delete(
  '/education/:educationId',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').param('educationId')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Education ID is required'),
  ],
  handleValidationErrors,
  profileController.removeEducation
);

/**
 * @route   PUT /api/v1/profile/preferences
 * @desc    Update job preferences
 * @access  Private
 */
router.put(
  '/preferences',
  authenticate,
  generalRateLimit,
  [
    require('express-validator').body('desired_roles')
      .optional()
      .isArray({ max: 20 })
      .withMessage('Desired roles must be an array with maximum 20 items'),
    require('express-validator').body('industries')
      .optional()
      .isArray({ max: 20 })
      .withMessage('Industries must be an array with maximum 20 items'),
    require('express-validator').body('work_arrangement')
      .optional()
      .isIn(['remote', 'hybrid', 'on_site', 'flexible'])
      .withMessage('Work arrangement must be one of: remote, hybrid, on_site, flexible'),
    require('express-validator').body('salary_min')
      .optional()
      .isInt({ min: 0, max: 10000000 })
      .withMessage('Minimum salary must be between 0 and 10,000,000'),
    require('express-validator').body('salary_max')
      .optional()
      .isInt({ min: 0, max: 10000000 })
      .withMessage('Maximum salary must be between 0 and 10,000,000'),
  ],
  handleValidationErrors,
  profileController.updateJobPreferences
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.code,
    });
  }
  next(error);
});

module.exports = router;
