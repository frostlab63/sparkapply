const atsController = require("../controllers/atsController");
const ATSIntegration = require("../services/atsService");

jest.mock("../services/atsService");

describe("ATS Controller", () => {
  it("should sync all data for a given platform", async () => {
    const req = {
      body: {
        platform: "workday",
        credentials: {},
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const syncJobsSpy = jest.spyOn(ATSIntegration.prototype, "syncJobs");
    const syncCandidatesSpy = jest.spyOn(ATSIntegration.prototype, "syncCandidates");
    const syncApplicationsSpy = jest.spyOn(ATSIntegration.prototype, "syncApplications");

    await atsController.syncAllData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "ATS data synced successfully" });
    expect(syncJobsSpy).toHaveBeenCalled();
    expect(syncCandidatesSpy).toHaveBeenCalled();
    expect(syncApplicationsSpy).toHaveBeenCalled();
  });
});

