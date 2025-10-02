const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");

router.post("/google/events", calendarController.createGoogleCalendarEvent);
router.post("/outlook/events", calendarController.createOutlookCalendarEvent);

module.exports = router;
