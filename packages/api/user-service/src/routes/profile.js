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
