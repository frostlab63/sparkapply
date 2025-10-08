const Document = require("../models/Document");
const Application = require("../models/Application");
const DocumentManagementService = require("../services/documentManagementService");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

const uploadDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const documentData = {
      applicationId: parseInt(req.body.applicationId),
      userId: parseInt(req.body.userId),
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    };

    const result = await DocumentManagementService.uploadDocument(
      documentData,
      req.file.buffer,
      req.file.originalname
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in uploadDocument:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload document",
    });
  }
};

const updateDocumentMetadata = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { title, description, tags, type } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = JSON.stringify(tags);
    if (type) updateData.type = type;
    updateData.updatedAt = new Date();

    const [updatedRowsCount] = await Document.update(updateData, {
      where: { id },
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    const updatedDocument = await Document.findByPk(id);

    res.json({
      success: true,
      data: updatedDocument,
      message: "Document metadata updated successfully",
    });
  } catch (error) {
    console.error("Error updating document metadata:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update document metadata",
    });
  }
};

module.exports = {
  uploadDocument,
  updateDocumentMetadata,
  upload,
};
