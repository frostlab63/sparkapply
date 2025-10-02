const MachineLearningService = require("../services/machineLearningService");

const machineLearningService = new MachineLearningService();

const predictCandidateSuccess = async (req, res) => {
  try {
    const { data } = req.body;
    const predictions = await machineLearningService.predict(data);
    res.status(200).json({ predictions });
  } catch (error) {
    res.status(500).json({ message: "Error making predictions", error: error.message });
  }
};

module.exports = {
  predictCandidateSuccess,
};

