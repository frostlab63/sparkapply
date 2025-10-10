const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// Job model
const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  remote_type: {
    type: DataTypes.ENUM('on_site', 'remote', 'hybrid'),
    defaultValue: 'on_site'
  },
  employment_type: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'internship'),
    defaultValue: 'full_time'
  },
  experience_level: {
    type: DataTypes.ENUM('entry', 'mid', 'senior', 'lead', 'executive'),
    defaultValue: 'mid'
  },
  salary_min: DataTypes.INTEGER,
  salary_max: DataTypes.INTEGER,
  salary_currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  description: DataTypes.TEXT,
  requirements: DataTypes.TEXT,
  benefits: DataTypes.TEXT,
  skills: DataTypes.JSON,
  categories: DataTypes.JSON,
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  posted_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'jobs',
  underscored: true
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'job-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Jobs endpoint with database integration
app.get('/api/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, location, remote_type, experience_level } = req.query;
    
    const where = { is_active: true };
    
    if (search) {
      where[Sequelize.Op.or] = [
        { title: { [Sequelize.Op.iLike]: `%${search}%` } },
        { company_name: { [Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (location) {
      where.location = { [Sequelize.Op.iLike]: `%${location}%` };
    }
    
    if (remote_type) {
      where.remote_type = remote_type;
    }
    
    if (experience_level) {
      where.experience_level = experience_level;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Job.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['posted_date', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
});

// Job by ID endpoint
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job',
      message: error.message
    });
  }
});

// Web scraping endpoints
app.post('/api/scraping/run', async (req, res) => {
  try {
    console.log('🚀 Starting comprehensive job collection...');
    
    const RealJobService = require('./services/realJobService');
    const jobService = new RealJobService();
    
    // Fetch jobs from all sources
    const allJobs = await jobService.fetchAllJobs();
    
    // Save to database
    let savedCount = 0;
    for (const jobData of allJobs) {
      try {
        // Check if job already exists
        const existingJob = await Job.findOne({
          where: {
            title: jobData.title,
            company_name: jobData.company_name
          }
        });

        if (!existingJob) {
          await Job.create(jobData);
          savedCount++;
        }
      } catch (error) {
        console.error('Error saving job:', error.message);
      }
    }

    res.json({
      success: true,
      message: `Successfully collected and saved ${savedCount} real jobs!`,
      data: {
        totalCollected: allJobs.length,
        totalSaved: savedCount,
        sampleJobs: allJobs.slice(0, 5).map(job => ({
          title: job.title,
          company: job.company_name,
          location: job.location,
          salary: `$${job.salary_min} - $${job.salary_max}`,
          source: job.source
        }))
      }
    });

  } catch (error) {
    console.error('Job collection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect jobs',
      message: error.message
    });
  }
});

// Get scraping status
app.get('/api/scraping/status', async (req, res) => {
  try {
    const totalJobs = await Job.count();
    const recentJobs = await Job.findAll({
      limit: 5,
      order: [['posted_date', 'DESC']],
      attributes: ['id', 'title', 'company_name', 'posted_date']
    });

    res.json({
      success: true,
      data: {
        totalJobs,
        recentJobs,
        lastUpdated: recentJobs[0]?.posted_date || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
});

// AI-powered recommendations endpoint
const aiMatchingService = require("./services/ai-matching-service");

app.post("/api/jobs/recommendations", async (req, res) => {
  const { userProfile, jobs } = req.body;

  if (!userProfile || !jobs) {
    return res.status(400).json({ success: false, message: "userProfile and jobs are required" });
  }

  const recommendedJobIds = await aiMatchingService.getJobRecommendations(userProfile, jobs);

  res.json({ success: true, recommendations: recommendedJobIds });
});

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
  console.log(`🚀 Job service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API endpoint: http://localhost:${PORT}/api/jobs`);
});

module.exports = app;
