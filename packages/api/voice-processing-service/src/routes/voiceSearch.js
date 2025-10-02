const express = require("express");
const router = express.Router();
const voiceSearchController = require("../controllers/voiceSearchController");
const multer = require("multer");

const upload = multer();

router.post("/search", upload.single("audio"), voiceSearchController.search);

module.exports = router;

