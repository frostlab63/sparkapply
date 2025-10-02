const hrisController = require("../controllers/hrisController");
const HRISIntegration = require("../services/hrisService");

jest.mock("../services/hrisService");

describe("HRIS Controller", () => {
  it("should sync all data for a given platform", async () => {
    const req = {
      body: {
        platform: "sap-successfactors",
        credentials: {},
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const syncEmployeesSpy = jest.spyOn(HRISIntegration.prototype, "syncEmployees");

    await hrisController.syncAllData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "HRIS data synced successfully" });
    expect(syncEmployeesSpy).toHaveBeenCalled();
  });
});

