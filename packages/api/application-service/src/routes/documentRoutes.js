const express = require("express");
const DocumentController = require("../controllers/documentController");
const multer = require("multer");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), DocumentController.uploadDocument);
router.get("/search", DocumentController.searchDocuments);
router.get("/organization", DocumentController.getDocumentOrganization);
router.get("/analytics", DocumentController.getDocumentAnalytics);
router.get("/dashboard", DocumentController.getDocumentDashboard);

module.exports = router;
