const express = require("express");
const ApplicationController = require("../controllers/applicationController");
const router = express.Router();

router.get("/", ApplicationController.getApplications);
router.post("/", ApplicationController.createApplication);
router.put("/:id", ApplicationController.updateApplication);
router.get("/analytics", ApplicationController.getApplicationAnalytics);
router.post("/bulk", ApplicationController.bulkUpdate);
router.get("/dashboard", ApplicationController.getApplicationDashboard);

module.exports = router;
