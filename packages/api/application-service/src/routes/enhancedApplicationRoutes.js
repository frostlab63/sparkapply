const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getApplicationsWithAnalytics,
  createApplicationWithIntelligence,
  updateApplicationWithAutomation,
  getApplicationAnalytics,
  bulkOperations,
  getApplicationDashboard,
  getApplicationSuggestions,
  exportApplications
} = require("../controllers/enhancedApplicationController");

const router = express.Router();

// Validation middleware
const validateUserId = [
  param("userId").isInt().withMessage("User ID must be an integer")
];

const validateApplicationId = [
  param("id").isInt().withMessage("Application ID must be an integer")
];

const validateCreateApplication = [
  body("userId").isInt().withMessage("User ID is required and must be an integer"),
  body("company").notEmpty().withMessage("Company name is required"),
  body("jobTitle").notEmpty().withMessage("Job title is required"),
  body("status").isIn([
    "draft", "applied", "phone_screening", "interview_scheduled", 
    "interviewed", "offer", "rejected", "withdrawn", "accepted", "no_response"
  ]).withMessage("Invalid status"),
];

const validateUpdateApplication = [
  body("company").optional().notEmpty().withMessage("Company name cannot be empty"),
  body("jobTitle").optional().notEmpty().withMessage("Job title cannot be empty"),
  body("status").optional().isIn([
    "draft", "applied", "phone_screening", "interview_scheduled", 
    "interviewed", "offer", "rejected", "withdrawn", "accepted", "no_response"
  ]).withMessage("Invalid status"),
];

const validateBulkOperation = [
  body("operation").isIn(["update_status", "archive", "delete", "export"]).withMessage("Invalid operation"),
  body("applicationIds").isArray({ min: 1 }).withMessage("Application IDs must be a non-empty array"),
  body("applicationIds.*").isInt().withMessage("Each application ID must be an integer"),
  body("data").optional().isObject().withMessage("Data must be an object")
];

const validateQueryParams = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

// Routes
router.get("/:userId", 
  validateUserId,
  validateQueryParams,
  getApplicationsWithAnalytics
);

router.post("/",
  validateCreateApplication,
  createApplicationWithIntelligence
);

router.put("/:id",
  validateApplicationId,
  validateUpdateApplication,
  updateApplicationWithAutomation
);

router.get("/analytics/:userId",
  validateUserId,
  query("timeframe").optional().isInt({ min: 1, max: 365 }).withMessage("Timeframe must be between 1 and 365 days"),
  getApplicationAnalytics
);

router.post("/bulk/:userId",
  validateUserId,
  validateBulkOperation,
  bulkOperations
);

router.get("/dashboard/:userId",
  validateUserId,
  getApplicationDashboard
);

router.get("/suggestions/:userId",
  validateUserId,
  getApplicationSuggestions
);

router.get("/export/:userId",
  validateUserId,
  query("format").isIn(["json", "csv"]).withMessage("Invalid format"),
  exportApplications
);

module.exports = router;

