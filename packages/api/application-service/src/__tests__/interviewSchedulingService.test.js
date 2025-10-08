const InterviewSchedulingService = require("../services/interviewSchedulingService");
const Interview = require("../models/Interview");
const Application = require("../models/Application");
const ApplicationNote = require("../models/ApplicationNote");

jest.mock("../models/Interview");
jest.mock("../models/Application");
jest.mock("../models/ApplicationNote");

describe("InterviewSchedulingService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should schedule an interview", async () => {
    const interviewData = { applicationId: 1, userId: 1, type: 'technical', scheduled_date: new Date(), duration: 60, location: "Online" };
    const createdInterview = { ...interviewData, id: 1 };

    const checkConflictsSpy = jest.spyOn(InterviewSchedulingService, 'checkSchedulingConflicts').mockResolvedValue([]);

    Interview.create.mockResolvedValue(createdInterview);
    Application.update.mockResolvedValue([1]);
    ApplicationNote.create.mockResolvedValue({});

    const result = await InterviewSchedulingService.scheduleInterview(interviewData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(createdInterview);
    expect(checkConflictsSpy).toHaveBeenCalledWith(interviewData.userId, interviewData.scheduled_date, interviewData.duration);
    expect(Interview.create).toHaveBeenCalledWith(expect.objectContaining({
        applicationId: interviewData.applicationId,
        type: interviewData.type,
        duration: interviewData.duration,
        location: interviewData.location,
        status: 'scheduled'
    }));

    checkConflictsSpy.mockRestore();
  });
});

