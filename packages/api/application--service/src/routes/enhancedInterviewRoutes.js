const express = require("express");
const { body, param } = require("express-validator");
const {
  scheduleInterviewWithConflictDetection,
} = require("../controllers/enhancedInterviewController");

const router = express.Router();

const validateScheduleInterview = [
  body("applicationId").isInt().withMessage("Application ID must be an integer"),
  body("scheduledDate").isISO8601().withMessage("Scheduled date must be a valid date"),
  body("duration").isInt({ min: 15 }).withMessage("Duration must be at least 15 minutes"),
];

router.post("/schedule", validateScheduleInterview, scheduleInterviewWithConflictDetection);

module.exports = router;
