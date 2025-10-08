const express = require('express');
const { body, param, query } = require('express-validator');
const {
  scheduleInterviewWithConflictDetection,
  getAvailableTimeSlots,
  getUpcomingInterviewsWithPreparation,
  updateInterviewStatusWithAutomation,
  getInterviewPreparationChecklist,
  getInterviewAnalytics,
  bulkRescheduleInterviews,
  getInterviewCalendar
} = require('../controllers/enhancedInterviewController');

const router = express.Router();

// Validation middleware
const validateUserId = [
  param('userId').isInt().withMessage('User ID must be an integer')
];

const validateInterviewId = [
  param('id').isInt().withMessage('Interview ID must be an integer')
];

const validateScheduleInterview = [
  body('applicationId').isInt().withMessage('Application ID is required and must be an integer'),
  body('type').isIn([
    'phone_screen', 'technical', 'behavioral', 'panel', 'final', 'informal', 'group'
  ]).withMessage('Invalid interview type'),
  body('scheduledDate').isISO8601().withMessage('Scheduled date must be a valid ISO date'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('interviewers').optional().isArray().withMessage('Interviewers must be an array'),
  body('interviewers.*.name').optional().isString().withMessage('Interviewer name must be a string'),
  body('interviewers.*.title').optional().isString().withMessage('Interviewer title must be a string'),
  body('interviewers.*.email').optional().isEmail().withMessage('Interviewer email must be valid'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('preparationTime').optional().isInt({ min: 0, max: 120 }).withMessage('Preparation time must be between 0 and 120 minutes'),
  body('userId').isInt().withMessage('User ID is required and must be an integer')
];

const validateUpdateInterviewStatus = [
  body('status').isIn([
    'scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'
  ]).withMessage('Invalid status'),
  body('feedback').optional().isString().withMessage('Feedback must be a string'),
  body('rescheduleDate').optional().isISO8601().withMessage('Reschedule date must be a valid ISO date'),
  body('rescheduleReason').optional().isString().withMessage('Reschedule reason must be a string')
];

const validateBulkReschedule = [
  body('interviewIds').isArray({ min: 1 }).withMessage('Interview IDs must be a non-empty array'),
  body('interviewIds.*').isInt().withMessage('Each interview ID must be an integer'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('newDates').optional().isArray().withMessage('New dates must be an array'),
  body('newDates.*').optional().isISO8601().withMessage('Each new date must be a valid ISO date')
];

const validateCalendarQuery = [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  query('view').optional().isIn(['day', 'week', 'month']).withMessage('View must be day, week, or month')
];

// Routes

/**
 * @route POST /api/interviews/schedule
 * @desc Schedule an interview with conflict detection
 * @access Private
 */
router.post('/',
  validateScheduleInterview,
  scheduleInterviewWithConflictDetection
);

/**
 * @route GET /api/interviews/available-slots/:userId
 * @desc Get available time slots for scheduling
 * @access Private
 */
router.get('/available-slots/:userId',
  validateUserId,
  query('date').notEmpty().withMessage('Date parameter is required'),
  query('date').isISO8601().withMessage('Date must be a valid ISO date'),
  query('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  query('timeZone').optional().isString().withMessage('Time zone must be a string'),
  query('businessHoursOnly').optional().isBoolean().withMessage('Business hours only must be a boolean'),
  getAvailableTimeSlots
);

/**
 * @route GET /api/interviews/upcoming/:userId
 * @desc Get upcoming interviews with preparation status
 * @access Private
 */
router.get('/upcoming/:userId',
  validateUserId,
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30'),
  getUpcomingInterviewsWithPreparation
);

/**
 * @route PUT /api/interviews/status/:id
 * @desc Update interview status with automated actions
 * @access Private
 */
router.put("/:id",
  validateInterviewId,
  validateUpdateInterviewStatus,
  updateInterviewStatusWithAutomation
);

/**
 * @route GET /api/interviews/preparation/:id
 * @desc Get interview preparation checklist
 * @access Private
 */
router.get('/preparation/:id',
  validateInterviewId,
  getInterviewPreparationChecklist
);

/**
 * @route GET /api/interviews/analytics/:userId
 * @desc Get interview analytics and insights
 * @access Private
 */
router.get('/analytics/:userId',
  validateUserId,
  query('timeframe').optional().isInt({ min: 1, max: 365 }).withMessage('Timeframe must be between 1 and 365 days'),
  getInterviewAnalytics
);

/**
 * @route POST /api/interviews/bulk-reschedule/:userId
 * @desc Bulk reschedule interviews
 * @access Private
 */
router.post('/bulk-reschedule/:userId',
  validateUserId,
  validateBulkReschedule,
  bulkRescheduleInterviews
);

/**
 * @route GET /api/interviews/calendar/:userId
 * @desc Get interview calendar view
 * @access Private
 */
router.get('/calendar/:userId',
  validateUserId,
  validateCalendarQuery,
  getInterviewCalendar
);

/**
 * @route GET /api/interviews/dashboard/:userId
 * @desc Get interview dashboard with key metrics
 * @access Private
 */
router.get('/dashboard/:userId',
  validateUserId,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get upcoming interviews
      const upcomingResult = await getUpcomingInterviewsWithPreparation({
        params: { userId },
        query: { days: 7 }
      }, { json: (data) => data });

      // Get analytics
      const analyticsResult = await getInterviewAnalytics({
        params: { userId },
        query: { timeframe: 30 }
      }, { json: (data) => data });

      // Get calendar for current month
      const calendarResult = await getInterviewCalendar({
        params: { userId },
        query: { view: 'month' }
      }, { json: (data) => data });

      res.json({
        success: true,
        data: {
          upcoming: {
            interviews: upcomingResult.data,
            summary: upcomingResult.summary
          },
          analytics: analyticsResult.data,
          calendar: {
            thisMonth: Object.keys(calendarResult.data.calendar).length,
            totalThisMonth: calendarResult.data.summary.totalInterviews
          },
          alerts: [
            ...upcomingResult.data.filter(i => i.urgency === 'critical').map(i => ({
              type: 'critical',
              message: `Interview with ${i.Application.company} in ${i.hoursUntilInterview} hours`,
              interviewId: i.id
            })),
            ...upcomingResult.data.filter(i => i.preparationStatus === 'urgent').map(i => ({
              type: 'warning',
              message: `Urgent preparation needed for ${i.Application.company} interview`,
              interviewId: i.id
            }))
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching interview dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch interview dashboard'
      });
    }
  }
);

/**
 * @route GET /api/interviews/suggestions/:userId
 * @desc Get interview scheduling suggestions and tips
 * @access Private
 */
router.get('/suggestions/:userId',
  validateUserId,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get analytics to base suggestions on
      const analyticsResult = await getInterviewAnalytics({
        params: { userId },
        query: { timeframe: 90 }
      }, { json: (data) => data });

      const analytics = analyticsResult.data;
      const suggestions = [];

      // Analyze patterns and provide suggestions
      if (analytics.cancelledInterviews > analytics.completedInterviews) {
        suggestions.push({
          type: 'scheduling',
          priority: 'high',
          title: 'Reduce Interview Cancellations',
          description: 'You have a high cancellation rate. Consider being more selective about interview scheduling.',
          actions: [
            'Only schedule interviews for positions you\'re genuinely interested in',
            'Block out adequate preparation time before confirming',
            'Set realistic expectations about your availability'
          ]
        });
      }

      if (analytics.successRate < 80) {
        suggestions.push({
          type: 'preparation',
          priority: 'medium',
          title: 'Improve Interview Completion Rate',
          description: 'Focus on better preparation to increase your interview success rate.',
          actions: [
            'Use the preparation checklist for each interview',
            'Practice mock interviews',
            'Research companies more thoroughly',
            'Prepare specific examples using the STAR method'
          ]
        });
      }

      if (analytics.avgDuration < 30) {
        suggestions.push({
          type: 'engagement',
          priority: 'medium',
          title: 'Increase Interview Engagement',
          description: 'Your interviews seem to be shorter than average. Consider being more engaging.',
          actions: [
            'Prepare thoughtful questions for the interviewer',
            'Share detailed examples and stories',
            'Show enthusiasm and interest in the role',
            'Ask for clarification when needed'
          ]
        });
      }

      // Time-based suggestions
      const mostCommonType = Object.entries(analytics.typeBreakdown)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostCommonType) {
        suggestions.push({
          type: 'optimization',
          priority: 'low',
          title: `Optimize ${mostCommonType[0]} Interview Performance`,
          description: `You have many ${mostCommonType[0]} interviews. Focus on excelling in this format.`,
          actions: [
            `Research best practices for ${mostCommonType[0]} interviews`,
            'Practice specific skills for this interview type',
            'Gather feedback from recent interviews of this type',
            'Prepare type-specific questions and examples'
          ]
        });
      }

      // General best practices
      suggestions.push({
        type: 'best_practice',
        priority: 'low',
        title: 'Interview Best Practices',
        description: 'General tips to improve your interview performance.',
        actions: [
          'Schedule interviews during your peak energy hours',
          'Leave buffer time between interviews',
          'Follow up with thank you emails within 24 hours',
          'Keep detailed notes about each interview',
          'Practice your elevator pitch regularly'
        ]
      });

      res.json({
        success: true,
        data: {
          suggestions: suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }),
          basedOnData: {
            totalInterviews: analytics.totalInterviews,
            timeframe: 90,
            successRate: analytics.successRate
          }
        }
      });
    } catch (error) {
      console.error('Error generating interview suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate suggestions'
      });
    }
  }
);

module.exports = router;
