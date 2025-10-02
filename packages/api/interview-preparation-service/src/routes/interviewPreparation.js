const express = require("express");
const router = express.Router();
const interviewPreparationController = require("../controllers/interviewPreparationController");

router.post("/questions", interviewPreparationController.generateQuestions);
router.post("/feedback", interviewPreparationController.provideFeedback);

module.exports = router;

