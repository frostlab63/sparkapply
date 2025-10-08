const express = require('express');
const cors = require('cors');
const moment = require('moment');
const _ = require('lodash');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3004;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// In-memory storage for analytics data (in production, this would be a database)
const analyticsData = {
  userEvents: [],
  jobViews: [],
  applications: [],
  searchQueries: [],
  userSessions: new Map(),
  dailyStats: new Map()
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'analytics-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    totalEvents: analyticsData.userEvents.length
  });
});

// Track user events
app.post('/api/analytics/events', (req, res) => {
  const { userId, eventType, eventData, timestamp } = req.body;
  
  if (!userId || !eventType) {
    return res.status(400).json({
      success: false,
      error: 'userId and eventType are required'
    });
  }
  
  const event = {
    id: generateEventId(),
    userId,
    eventType,
    eventData: eventData || {},
    timestamp: timestamp || new Date().toISOString(),
    sessionId: req.headers['session-id'] || 'unknown'
  };
  
  analyticsData.userEvents.push(event);
  
  // Update daily stats
  const dateKey = moment(event.timestamp).format('YYYY-MM-DD');
  if (!analyticsData.dailyStats.has(dateKey)) {
    analyticsData.dailyStats.set(dateKey, {
      date: dateKey,
      totalEvents: 0,
      uniqueUsers: new Set(),
      eventTypes: {}
    });
  }
  
  const dayStats = analyticsData.dailyStats.get(dateKey);
  dayStats.totalEvents++;
  dayStats.uniqueUsers.add(userId);
  dayStats.eventTypes[eventType] = (dayStats.eventTypes[eventType] || 0) + 1;
  
  console.log(`Event tracked: ${eventType} for user ${userId}`);
  
  res.json({
    success: true,
    eventId: event.id,
    message: 'Event tracked successfully'
  });
});

// Track job views
app.post('/api/analytics/job-views', (req, res) => {
  const { userId, jobId, jobTitle, company, viewDuration } = req.body;
  
  if (!userId || !jobId) {
    return res.status(400).json({
      success: false,
      error: 'userId and jobId are required'
    });
  }
  
  const jobView = {
    id: generateEventId(),
    userId,
    jobId,
    jobTitle: jobTitle || 'Unknown',
    company: company || 'Unknown',
    viewDuration: viewDuration || 0,
    timestamp: new Date().toISOString()
  };
  
  analyticsData.jobViews.push(jobView);
  
  console.log(`Job view tracked: ${jobTitle} by user ${userId}`);
  
  res.json({
    success: true,
    viewId: jobView.id,
    message: 'Job view tracked successfully'
  });
});

// Track job applications
app.post('/api/analytics/applications', (req, res) => {
  const { userId, jobId, jobTitle, company, applicationStatus } = req.body;
  
  if (!userId || !jobId) {
    return res.status(400).json({
      success: false,
      error: 'userId and jobId are required'
    });
  }
  
  const application = {
    id: generateEventId(),
    userId,
    jobId,
    jobTitle: jobTitle || 'Unknown',
    company: company || 'Unknown',
    applicationStatus: applicationStatus || 'submitted',
    timestamp: new Date().toISOString()
  };
  
  analyticsData.applications.push(application);
  
  console.log(`Application tracked: ${jobTitle} by user ${userId}`);
  
  res.json({
    success: true,
    applicationId: application.id,
    message: 'Application tracked successfully'
  });
});

// Track search queries
app.post('/api/analytics/searches', (req, res) => {
  const { userId, query, filters, resultsCount } = req.body;
  
  if (!userId || !query) {
    return res.status(400).json({
      success: false,
      error: 'userId and query are required'
    });
  }
  
  const search = {
    id: generateEventId(),
    userId,
    query,
    filters: filters || {},
    resultsCount: resultsCount || 0,
    timestamp: new Date().toISOString()
  };
  
  analyticsData.searchQueries.push(search);
  
  console.log(`Search tracked: "${query}" by user ${userId}`);
  
  res.json({
    success: true,
    searchId: search.id,
    message: 'Search tracked successfully'
  });
});

// Get user behavior insights
app.get('/api/analytics/user-insights/:userId', (req, res) => {
  const { userId } = req.params;
  
  const userEvents = analyticsData.userEvents.filter(event => event.userId === userId);
  const userJobViews = analyticsData.jobViews.filter(view => view.userId === userId);
  const userApplications = analyticsData.applications.filter(app => app.userId === userId);
  const userSearches = analyticsData.searchQueries.filter(search => search.userId === userId);
  
  const insights = {
    userId,
    totalEvents: userEvents.length,
    totalJobViews: userJobViews.length,
    totalApplications: userApplications.length,
    totalSearches: userSearches.length,
    averageViewDuration: _.meanBy(userJobViews, 'viewDuration') || 0,
    mostViewedCompanies: getMostFrequent(userJobViews, 'company'),
    mostSearchedTerms: getMostFrequent(userSearches, 'query'),
    applicationSuccessRate: calculateApplicationSuccessRate(userApplications),
    activityTimeline: getActivityTimeline(userEvents),
    lastActivity: _.maxBy(userEvents, 'timestamp')?.timestamp
  };
  
  res.json({
    success: true,
    data: insights,
    timestamp: new Date().toISOString()
  });
});

// Get job market insights
app.get('/api/analytics/job-market-insights', (req, res) => {
  const insights = {
    totalJobViews: analyticsData.jobViews.length,
    totalApplications: analyticsData.applications.length,
    totalSearches: analyticsData.searchQueries.length,
    mostViewedJobs: getMostViewedJobs(),
    mostPopularCompanies: getMostFrequent(analyticsData.jobViews, 'company'),
    mostSearchedTerms: getMostFrequent(analyticsData.searchQueries, 'query'),
    applicationTrends: getApplicationTrends(),
    searchTrends: getSearchTrends(),
    conversionRate: calculateOverallConversionRate(),
    peakActivityHours: getPeakActivityHours()
  };
  
  res.json({
    success: true,
    data: insights,
    timestamp: new Date().toISOString()
  });
});

// Get daily analytics dashboard
app.get('/api/analytics/dashboard', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateRange = [];
  if (startDate && endDate) {
    const start = moment(startDate);
    const end = moment(endDate);
    while (start.isSameOrBefore(end)) {
      dateRange.push(start.format('YYYY-MM-DD'));
      start.add(1, 'day');
    }
  } else {
    // Default to last 7 days
    for (let i = 6; i >= 0; i--) {
      dateRange.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
    }
  }
  
  const dashboardData = dateRange.map(date => {
    const dayStats = analyticsData.dailyStats.get(date);
    return {
      date,
      totalEvents: dayStats?.totalEvents || 0,
      uniqueUsers: dayStats?.uniqueUsers?.size || 0,
      eventTypes: dayStats?.eventTypes || {}
    };
  });
  
  res.json({
    success: true,
    data: {
      dateRange: {
        start: dateRange[0],
        end: dateRange[dateRange.length - 1]
      },
      dailyStats: dashboardData,
      summary: {
        totalEvents: _.sumBy(dashboardData, 'totalEvents'),
        totalUniqueUsers: _.uniqBy(
          Array.from(analyticsData.dailyStats.values()).flatMap(day => 
            Array.from(day.uniqueUsers)
          )
        ).length,
        averageEventsPerDay: _.meanBy(dashboardData, 'totalEvents')
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function generateEventId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getMostFrequent(array, property) {
  const counts = _.countBy(array, property);
  return _.orderBy(
    Object.entries(counts).map(([key, count]) => ({ [property]: key, count })),
    'count',
    'desc'
  ).slice(0, 5);
}

function getMostViewedJobs() {
  const jobCounts = _.countBy(analyticsData.jobViews, 'jobId');
  return _.orderBy(
    Object.entries(jobCounts).map(([jobId, count]) => {
      const jobView = analyticsData.jobViews.find(view => view.jobId === jobId);
      return {
        jobId,
        jobTitle: jobView?.jobTitle || 'Unknown',
        company: jobView?.company || 'Unknown',
        viewCount: count
      };
    }),
    'viewCount',
    'desc'
  ).slice(0, 10);
}

function calculateApplicationSuccessRate(applications) {
  if (applications.length === 0) return 0;
  const successfulApps = applications.filter(app => 
    app.applicationStatus === 'accepted' || app.applicationStatus === 'hired'
  );
  return (successfulApps.length / applications.length) * 100;
}

function calculateOverallConversionRate() {
  if (analyticsData.jobViews.length === 0) return 0;
  return (analyticsData.applications.length / analyticsData.jobViews.length) * 100;
}

function getActivityTimeline(events) {
  const timeline = _.groupBy(events, event => 
    moment(event.timestamp).format('YYYY-MM-DD HH:00')
  );
  
  return Object.entries(timeline).map(([hour, events]) => ({
    hour,
    eventCount: events.length,
    eventTypes: _.countBy(events, 'eventType')
  }));
}

function getApplicationTrends() {
  const trends = _.groupBy(analyticsData.applications, app => 
    moment(app.timestamp).format('YYYY-MM-DD')
  );
  
  return Object.entries(trends).map(([date, applications]) => ({
    date,
    count: applications.length,
    companies: _.uniqBy(applications, 'company').length
  }));
}

function getSearchTrends() {
  const trends = _.groupBy(analyticsData.searchQueries, search => 
    moment(search.timestamp).format('YYYY-MM-DD')
  );
  
  return Object.entries(trends).map(([date, searches]) => ({
    date,
    count: searches.length,
    uniqueQueries: _.uniqBy(searches, 'query').length
  }));
}

function getPeakActivityHours() {
  const hourCounts = _.countBy(analyticsData.userEvents, event => 
    moment(event.timestamp).format('HH')
  );
  
  return _.orderBy(
    Object.entries(hourCounts).map(([hour, count]) => ({ hour: parseInt(hour), count })),
    'count',
    'desc'
  ).slice(0, 5);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Analytics service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Analytics dashboard: http://localhost:${PORT}/api/analytics/dashboard`);
});

module.exports = app;
