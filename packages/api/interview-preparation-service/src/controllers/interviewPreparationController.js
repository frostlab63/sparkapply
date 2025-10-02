const InterviewCoachService = require("../services/interviewCoachService");

const interviewCoachService = new InterviewCoachService();

const generateQuestions = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const questions = await interviewCoachService.generateQuestions(jobDescription);
    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ message: "Error generating questions", error: error.message });
  }
};

const provideFeedback = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const feedback = await interviewCoachService.provideFeedback(question, answer);
    res.status(200).json({ feedback });
  } catch (error) {
    res.status(500).json({ message: "Error providing feedback", error: error.message });
  }
};

module.exports = {
  generateQuestions,
  provideFeedback,
};

