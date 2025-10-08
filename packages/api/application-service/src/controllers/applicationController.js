const ApplicationTrackingService = require('../services/applicationTrackingService');

class ApplicationController {
  static async getApplications(req, res) {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = req.query;
      const result = await ApplicationTrackingService.getApplications(req.user.id, page, limit, sortBy, sortOrder, filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createApplication(req, res) {
    try {
      const result = await ApplicationTrackingService.createApplication({ ...req.body, userId: req.user.id });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateApplication(req, res) {
    try {
      const result = await ApplicationTrackingService.updateApplication(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getApplicationAnalytics(req, res) {
    try {
      const result = await ApplicationTrackingService.getApplicationAnalytics(req.user.id, req.query.timeframe);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async bulkUpdate(req, res) {
    try {
      const { operation, applicationIds, data } = req.body;
      const result = await ApplicationTrackingService.bulkUpdate(req.user.id, operation, applicationIds, data);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getApplicationDashboard(req, res) {
    try {
      const result = await ApplicationTrackingService.getApplicationDashboard(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ApplicationController;
