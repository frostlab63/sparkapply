const express = require("express");
const router = express.Router();
const hrisController = require("../controllers/hrisController");

router.post("/sync", hrisController.syncAllData);

module.exports = router;

