const InterviewSchedulingService = require('../services/interviewSchedulingService');

class InterviewController {
  static async scheduleInterview(req, res) {
    try {
      const result = await InterviewSchedulingService.scheduleInterview({ ...req.body, userId: req.user.id });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getUpcomingInterviews(req, res) {
    try {
      const result = await InterviewSchedulingService.getUpcomingInterviews(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getInterviewCalendar(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const result = await InterviewSchedulingService.getInterviewCalendar(req.user.id, startDate, endDate);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = InterviewController;
