const { google } = require("googleapis");
const { Client } = require("@microsoft/microsoft-graph-client");

class CalendarService {
  async createGoogleCalendarEvent(auth, event) {
    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    return response.data;
  }

  async createOutlookCalendarEvent(accessToken, event) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    const response = await client.api("/me/events").post(event);
    return response;
  }
}

module.exports = new CalendarService();
