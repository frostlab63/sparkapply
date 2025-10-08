const DocumentManagementService = require('../services/documentManagementService');

class DocumentController {
  static async uploadDocument(req, res) {
    try {
      const result = await DocumentManagementService.uploadDocument({ ...req.body, userId: req.user.id }, req.file.buffer, req.file.originalname);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async searchDocuments(req, res) {
    try {
      const result = await DocumentManagementService.searchDocuments(req.user.id, req.query.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getDocumentOrganization(req, res) {
    try {
      const result = await DocumentManagementService.getDocumentOrganization(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getDocumentAnalytics(req, res) {
    try {
      const result = await DocumentManagementService.getDocumentAnalytics(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getDocumentDashboard(req, res) {
    try {
      const result = await DocumentManagementService.getDocumentDashboard(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = DocumentController; DocumentController;
