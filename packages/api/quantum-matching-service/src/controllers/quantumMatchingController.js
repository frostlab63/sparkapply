const QuantumMatchingService = require("../services/quantumMatchingService");

const quantumMatchingService = new QuantumMatchingService();

const match = async (req, res) => {
  try {
    const { candidate, job } = req.body;
    const result = await quantumMatchingService.match(candidate, job);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error performing quantum match", error: error.message });
  }
};

module.exports = {
  match,
};

