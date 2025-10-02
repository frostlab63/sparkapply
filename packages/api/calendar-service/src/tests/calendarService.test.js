const calendarService = require("../services/calendarService");
const { google } = require("googleapis");
const { Client } = require("@microsoft/microsoft-graph-client");

jest.mock("googleapis");
jest.mock("@microsoft/microsoft-graph-client");

describe("Calendar Service", () => {
  it("should create a Google Calendar event", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: { id: "123" } });
    google.calendar.mockReturnValue({ events: { insert: mockInsert } });

    const event = await calendarService.createGoogleCalendarEvent({}, {});

    expect(event.id).toBe("123");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should create an Outlook Calendar event", async () => {
    const mockPost = jest.fn().mockResolvedValue({ id: "456" });
    Client.init.mockReturnValue({ api: () => ({ post: mockPost }) });

    const event = await calendarService.createOutlookCalendarEvent("token", {});

    expect(event.id).toBe("456");
    expect(mockPost).toHaveBeenCalled();
  });
});
