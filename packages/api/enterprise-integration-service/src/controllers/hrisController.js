const HRISIntegration = require("../services/hrisService");

const syncAllData = async (req, res) => {
  try {
    const { platform, credentials } = req.body;
    const hrisIntegration = new HRISIntegration(platform, credentials);

    await hrisIntegration.syncEmployees();

    res.status(200).json({ message: "HRIS data synced successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error syncing HRIS data", error: error.message });
  }
};

module.exports = {
  syncAllData,
};

