const express = require("express");
const InterviewController = require("../controllers/interviewController");
const router = express.Router();

router.post("/", InterviewController.scheduleInterview);
router.get("/upcoming", InterviewController.getUpcomingInterviews);
router.get("/calendar", InterviewController.getInterviewCalendar);

module.exports = router;
