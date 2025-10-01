const express = require('express');
const authRoutes = require('./auth');
const profileRoutes = require('./profile');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User service is healthy',
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: '1.0.0',
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SparkApply User Service API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'POST /auth/refresh': 'Refresh access token',
        'GET /auth/verify/:token': 'Verify email address',
        'POST /auth/resend-verification': 'Resend verification email',
        'POST /auth/forgot-password': 'Send password reset email',
        'POST /auth/reset-password/:token': 'Reset password with token',
        'POST /auth/change-password': 'Change password (authenticated)',
        'POST /auth/logout': 'Logout user',
        'GET /auth/me': 'Get current user info',
      },
      profile: {
        'GET /profile/:userId?': 'Get user profile',
        'PUT /profile/job-seeker': 'Update job seeker profile',
        'POST /profile/skills': 'Add skill to profile',
        'DELETE /profile/skills/:skillName': 'Remove skill from profile',
        'POST /profile/resume': 'Upload resume',
        'GET /profile/search': 'Search public profiles',
        'GET /profile/stats': 'Get profile statistics',
      },
    },
    documentation: 'https://docs.sparkapply.com/api/user-service',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

module.exports = router;
