const express = require("express");
const router = express.Router();
const quantumMatchingController = require("../controllers/quantumMatchingController");

router.post("/match", quantumMatchingController.match);

module.exports = router;

