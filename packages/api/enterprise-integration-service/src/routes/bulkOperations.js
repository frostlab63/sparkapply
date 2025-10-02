const express = require("express");
const router = express.Router();
const bulkOperationsController = require("../controllers/bulkOperationsController");

router.post("/import", bulkOperationsController.importData);
router.get("/export", bulkOperationsController.exportData);

module.exports = router;

