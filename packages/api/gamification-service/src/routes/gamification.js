const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamificationController");

router.post("/badges/award", gamificationController.awardBadge);
router.post("/actions/track", gamificationController.trackAction);

module.exports = router;
