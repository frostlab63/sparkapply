const Application = require('../models/Application');
const { Op } = require('sequelize');

class ApplicationTrackingService {
  static async getApplications(userId, page = 1, limit = 10, sortBy = 'lastUpdated', sortOrder = 'DESC', filters = {}, includeAnalytics = false) {
    const offset = (page - 1) * limit;
    const where = { userId, ...filters };

    const applications = await Application.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    let analytics = {};
    if (includeAnalytics) {
      analytics = await this.calculateApplicationMetrics(userId, 30);
    }

    return {
      success: true,
      data: {
        applications: applications.rows,
        pagination: {
          total: applications.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(applications.count / limit),
        },
        analytics,
      },
    };
  }

  static async createApplication(applicationData) {
    const application = await Application.create(applicationData);
    return { success: true, data: application, message: 'Application created successfully' };
  }

  static async updateApplication(id, updateData) {
    const [updatedRowsCount] = await Application.update(updateData, { where: { id } });
    if (updatedRowsCount === 0) {
      return { success: false, error: 'Application not found' };
    }
    const updatedApplication = await Application.findByPk(id);
    return { success: true, data: updatedApplication, message: 'Application updated successfully' };
  }

  static async getApplicationAnalytics(userId, timeframe = 30) {
    const metrics = await this.calculateApplicationMetrics(userId, timeframe);
    return { success: true, data: { metrics, timeframe, generatedAt: new Date().toISOString() } };
  }

  static async bulkUpdate(userId, operation, applicationIds, data) {
    let results = {};
    switch (operation) {
      case 'update_status':
        await Application.update({ status: data.status }, { where: { id: { [Op.in]: applicationIds }, userId } });
        results = { success: true, message: `${applicationIds.length} applications updated` };
        break;
      case 'archive':
        await Application.update({ isArchived: true }, { where: { id: { [Op.in]: applicationIds }, userId } });
        results = { success: true, message: `${applicationIds.length} applications archived` };
        break;
      case 'delete':
        const deletedCount = await Application.destroy({ where: { id: { [Op.in]: applicationIds }, userId } });
        results = { success: true, message: `${deletedCount} applications deleted` };
        break;
      default:
        return { success: false, error: 'Invalid operation' };
    }
    return { success: true, operation, results };
  }

  static async getApplicationDashboard(userId) {
    const totalApplications = await Application.count({ where: { userId } });
    const activeApplications = await Application.count({ where: { userId, status: { [Op.notIn]: ['rejected', 'withdrawn', 'offer_declined'] } } });
    const interviewsScheduled = await Application.count({ where: { userId, status: 'interview_scheduled' } });
    return { success: true, data: { totalApplications, activeApplications, interviewsScheduled } };
  }

  static async getApplicationSuggestions(userId) {
    // Placeholder for AI-powered suggestions
    return { success: true, data: [] };
  }

  static async exportApplications(userId, format) {
    const applications = await Application.findAll({ where: { userId } });
    if (format === 'csv') {
      // CSV conversion logic here
      return { success: true, data: 'csv data' };
    } else {
      return { success: true, data: applications };
    }
  }

  static async calculateApplicationMetrics(userId, timeframe) {
    const applications = await Application.findAll({
        where: {
            userId,
            appliedDate: {
                [Op.gte]: new Date(new Date() - timeframe * 24 * 60 * 60 * 1000),
            },
        },
    });

    const totalApplications = applications.length;
    if (totalApplications === 0) {
        return {
            totalApplications: 0,
            responseRate: 0,
            interviewRate: 0,
            offerRate: 0,
            rejectionRate: 0,
            averageTimeToResponse: 0,
            averageTimeToInterview: 0,
            averageTimeToOffer: 0,
            statusBreakdown: {},
            priorityBreakdown: {},
            sourceBreakdown: {},
        };
    }

    const respondedApplications = applications.filter(app => app.status !== 'applied' && app.status !== 'draft');
    const interviewApplications = applications.filter(app => app.status.includes('interview'));
    const offerApplications = applications.filter(app => app.status.includes('offer'));
    const rejectedApplications = applications.filter(app => app.status === 'rejected');

    const responseRate = (respondedApplications.length / totalApplications) * 100;
    const interviewRate = (interviewApplications.length / totalApplications) * 100;
    const offerRate = (offerApplications.length / totalApplications) * 100;
    const rejectionRate = (rejectedApplications.length / totalApplications) * 100;

    const timeToResponse = respondedApplications.map(app => (new Date(app.lastUpdated) - new Date(app.appliedDate)) / (1000 * 60 * 60 * 24));
    const averageTimeToResponse = timeToResponse.reduce((a, b) => a + b, 0) / timeToResponse.length || 0;

    const timeToInterview = interviewApplications.map(app => (new Date(app.lastUpdated) - new Date(app.appliedDate)) / (1000 * 60 * 60 * 24));
    const averageTimeToInterview = timeToInterview.reduce((a, b) => a + b, 0) / timeToInterview.length || 0;

    const timeToOffer = offerApplications.map(app => (new Date(app.lastUpdated) - new Date(app.appliedDate)) / (1000 * 60 * 60 * 24));
    const averageTimeToOffer = timeToOffer.reduce((a, b) => a + b, 0) / timeToOffer.length || 0;

    const statusBreakdown = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});

    const priorityBreakdown = applications.reduce((acc, app) => {
        acc[app.priority] = (acc[app.priority] || 0) + 1;
        return acc;
    }, {});

    const sourceBreakdown = applications.reduce((acc, app) => {
        acc[app.source] = (acc[app.source] || 0) + 1;
        return acc;
    }, {});

    return {
        totalApplications,
        responseRate: parseFloat(responseRate.toFixed(2)),
        interviewRate: parseFloat(interviewRate.toFixed(2)),
        offerRate: parseFloat(offerRate.toFixed(2)),
        rejectionRate: parseFloat(rejectionRate.toFixed(2)),
        averageTimeToResponse: parseFloat(averageTimeToResponse.toFixed(2)),
        averageTimeToInterview: parseFloat(averageTimeToInterview.toFixed(2)),
        averageTimeToOffer: parseFloat(averageTimeToOffer.toFixed(2)),
        statusBreakdown,
        priorityBreakdown,
        sourceBreakdown,
    };
  }

  static async bulkUpdateApplications(userId, applicationIds, status) {
    const [updatedRowsCount] = await Application.update({ status }, { where: { id: { [Op.in]: applicationIds }, userId } });
    return { success: true, updatedCount: updatedRowsCount };
  }
}

module.exports = ApplicationTrackingService;

