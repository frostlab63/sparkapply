const { validationResult } = require("express-validator");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Document = require("../models/Document");
const ApplicationNote = require("../models/ApplicationNote");
const ApplicationTrackingService = require("../services/applicationTrackingService");
const { Op } = require("sequelize");
const moment = require("moment");

const getApplicationsWithAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      status, 
      priority, 
      company, 
      page = 1, 
      limit = 10, 
      sortBy = 'lastUpdated',
      sortOrder = 'DESC',
      search,
      archived = false,
      dateFrom,
      dateTo,
      salaryMin,
      salaryMax,
      location,
      jobType,
      workMode,
      includeAnalytics = true
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { 
      userId,
      is_archived: archived === 'true'
    };

    if (status) {
      if (status.includes(',')) {
        where.status = { [Op.in]: status.split(',') };
      } else {
        where.status = status;
      }
    }
    
    if (priority) where.priority = priority;
    if (company) where.company = { [Op.iLike]: `%${company}%` };
    if (location) where.location = { [Op.iLike]: `%${location}%` };
    if (jobType) where.jobType = jobType;
    if (workMode) where.workMode = workMode;
    
    if (dateFrom || dateTo) {
      where.appliedDate = {};
      if (dateFrom) where.appliedDate[Op.gte] = new Date(dateFrom);
      if (dateTo) where.appliedDate[Op.lte] = new Date(dateTo);
    }
    
    if (salaryMin || salaryMax) {
      where.salary = {};
      if (salaryMin) where.salary[Op.gte] = parseInt(salaryMin);
      if (salaryMax) where.salary[Op.lte] = parseInt(salaryMax);
    }
    
    if (search) {
      where[Op.or] = [
        { jobTitle: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { skills: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const sortMap = {
      lastUpdated: 'last_updated',
      appliedDate: 'applied_date',
      createdAt: 'created_at'
    };
    const orderColumn = sortMap[sortBy] || 'last_updated';

    const applications = await Application.findAndCountAll({
      where,
      include: [
        {
          model: Interview,
          as: 'interviews',
          required: false,
          order: [['scheduled_date', 'ASC']]
        },
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { isActive: true }
        },
        {
          model: ApplicationNote,
          as: 'applicationNotes',
          required: false,
          limit: 3,
          order: [['created_at', 'DESC']]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[orderColumn, sortOrder.toUpperCase()]],
      distinct: true
    });

    const enrichedApplications = applications.rows.map(app => app.toJSON());

    let analytics = {};
    if (includeAnalytics === 'true') {
      analytics = await ApplicationTrackingService.calculateApplicationMetrics(userId, 30);
    }

    res.json({
      success: true,
      data: {
        applications: enrichedApplications,
        pagination: {
          total: applications.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(applications.count / limit)
        },
        analytics: includeAnalytics === 'true' ? analytics : null,
      }
    });
  } catch (error) {
    console.error('Error fetching applications with analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
};

const createApplicationWithIntelligence = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const applicationData = {
      ...req.body,
      userId: req.user.id,
      lastUpdated: new Date()
    };

    const application = await Application.create(applicationData);

    const completeApplication = await Application.findByPk(application.id, {
      include: [
        { model: Interview, as: 'interviews' },
        { model: Document, as: 'documents' },
        { model: ApplicationNote, as: 'applicationNotes' }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeApplication,
      message: 'Application created successfully',
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create application'
    });
  }
};

const updateApplicationWithAutomation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    console.log('req.user in updateApplicationWithAutomation:', req.user);
    const { id } = req.params;
    const updateData = {
      ...req.body,
      lastUpdated: new Date()
    };

    const [updatedRowsCount] = await Application.update(updateData, {
      where: { id, userId: req.user.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const updatedApplication = await Application.findByPk(id, {
      include: [
        { model: Interview, as: 'interviews' },
        { model: Document, as: 'documents' },
        { model: ApplicationNote, as: 'applicationNotes' }
      ]
    });

    res.json({
      success: true,
      data: updatedApplication,
      message: 'Application updated successfully',
    });
  } catch (error) {
    console.error('Error updating application:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to update application'
    });
  }
};

const getApplicationAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 30 } = req.query;

    const metrics = await ApplicationTrackingService.calculateApplicationMetrics(userId, parseInt(timeframe));

    res.json({
      success: true,
      data: {
        metrics: metrics,
        timeframe: parseInt(timeframe),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
};

const bulkOperations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { operation, applicationIds, data } = req.body;

    let results = {};

    switch (operation) {
      case 'update_status':
        const updates = applicationIds.map(id => ({
          applicationId: id,
          status: data.status,
          notes: data.notes
        }));
        results = await ApplicationTrackingService.bulkUpdateApplications(userId, updates);
        break;

      case 'archive':
        await Application.update(
          { isArchived: true, lastUpdated: new Date() },
          { where: { id: { [Op.in]: applicationIds }, userId } }
        );
        results = { success: true, message: `${applicationIds.length} applications archived` };
        break;

      case 'delete':
        const deletedCount = await Application.destroy({
          where: { id: { [Op.in]: applicationIds }, userId }
        });
        results = { success: true, message: `${deletedCount} applications deleted` };
        break;

      case 'export':
        results = await ApplicationTrackingService.exportApplicationData(userId, data.format);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid operation'
        });
    }

    res.json({
      success: true,
      operation,
      results
    });
  } catch (error) {
    console.error('Error in bulk operations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation'
    });
  }
};

const getApplicationDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await ApplicationTrackingService.getApplicationDashboard(parseInt(userId));
    res.json(result);
  } catch (error) {
    console.error("Error getting application dashboard:", error);
    res.status(500).json({ success: false, error: "Failed to get application dashboard" });
  }
};

const getApplicationSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await ApplicationTrackingService.getApplicationSuggestions(parseInt(userId));
    res.json(result);
  } catch (error) {
    console.error("Error getting application suggestions:", error);
    res.status(500).json({ success: false, error: "Failed to get application suggestions" });
  }
};

const exportApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { format } = req.query;
    const result = await ApplicationTrackingService.exportApplications(parseInt(userId), format);
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('applications.csv');
      res.send(result.data);
    } else {
      res.json(result.data);
    }
  } catch (error) {
    console.error("Error exporting applications:", error);
    res.status(500).json({ success: false, error: "Failed to export applications" });
  }
};

module.exports = {
  getApplicationsWithAnalytics,
  createApplicationWithIntelligence,
  updateApplicationWithAutomation,
  getApplicationAnalytics,
  bulkOperations,
  getApplicationDashboard,
  getApplicationSuggestions,
  exportApplications
};
