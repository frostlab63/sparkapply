const calendarService = require("../services/calendarService");

class CalendarController {
  async createGoogleCalendarEvent(req, res) {
    const { auth, event } = req.body;
    const newEvent = await calendarService.createGoogleCalendarEvent(auth, event);
    res.status(201).json(newEvent);
  }

  async createOutlookCalendarEvent(req, res) {
    const { accessToken, event } = req.body;
    const newEvent = await calendarService.createOutlookCalendarEvent(
      accessToken,
      event
    );
    res.status(201).json(newEvent);
  }
}

module.exports = new CalendarController();
