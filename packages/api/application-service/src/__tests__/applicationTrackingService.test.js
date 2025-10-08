const ApplicationTrackingService = require("../services/applicationTrackingService");
const Application = require("../models/Application");

jest.mock("../models/Application");

describe("ApplicationTrackingService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create an application", async () => {
    const applicationData = { userId: 1, company: "Test Co", jobTitle: "Tester" };
    Application.create.mockResolvedValue(applicationData);

    const result = await ApplicationTrackingService.createApplication(applicationData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(applicationData);
    expect(Application.create).toHaveBeenCalledWith(applicationData);
  });
});
