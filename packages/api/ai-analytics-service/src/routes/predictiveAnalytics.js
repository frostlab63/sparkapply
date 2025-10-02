const express = require("express");
const router = express.Router();
const predictiveAnalyticsController = require("../controllers/predictiveAnalyticsController");

router.post("/predict", predictiveAnalyticsController.predictCandidateSuccess);

module.exports = router;

