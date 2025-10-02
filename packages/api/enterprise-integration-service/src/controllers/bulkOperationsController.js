const BulkOperationsService = require("../services/bulkOperationsService");

const bulkOperationsService = new BulkOperationsService();

const importData = async (req, res) => {
  try {
    const result = await bulkOperationsService.importData(req.file);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error importing data", error: error.message });
  }
};

const exportData = async (req, res) => {
  try {
    const result = await bulkOperationsService.exportData();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error exporting data", error: error.message });
  }
};

module.exports = {
  importData,
  exportData,
};

