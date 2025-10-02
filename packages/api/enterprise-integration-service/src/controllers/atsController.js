const ATSIntegration = require("../services/atsService");

const syncAllData = async (req, res) => {
  try {
    const { platform, credentials } = req.body;
    const atsIntegration = new ATSIntegration(platform, credentials);

    await atsIntegration.syncJobs();
    await atsIntegration.syncCandidates();
    await atsIntegration.syncApplications();

    res.status(200).json({ message: "ATS data synced successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error syncing ATS data", error: error.message });
  }
};

module.exports = {
  syncAllData,
};

