const express = require("express");
const router = express.Router();
const atsController = require("../controllers/atsController");

router.post("/sync", atsController.syncAllData);

module.exports = router;

