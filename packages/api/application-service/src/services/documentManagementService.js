const Document = require("../models/Document");
const Application = require("../models/Application");
const { Op } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const moment = require("moment");

class DocumentManagementService {
  static async uploadDocument(documentData, fileBuffer, originalFilename) {
    console.log("In uploadDocument, fileBuffer:", fileBuffer);
    try {
      const {
        applicationId,
        userId,
        type,
        title,
        description,
        tags = [],
      } = documentData;

      if (!userId) {
        throw new Error("User ID is required for uploading documents.");
      }

      const validation = this.validateFile(fileBuffer, originalFilename);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileExtension = path.extname(originalFilename);
      const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      const secureFilename = `${fileHash}_${Date.now()}${fileExtension}`;

      const uploadDir = path.join(process.cwd(), "uploads", "documents", userId.toString());
      await this.ensureDirectoryExists(uploadDir);

      const filePath = path.join(uploadDir, secureFilename);
      await fs.writeFile(filePath, fileBuffer);

      const metadata = await this.extractFileMetadata(fileBuffer, originalFilename);

      const document = await Document.create({
        applicationId,
        userId,
        type,
        title: title || this.generateDocumentTitle(type, originalFilename),
        description,
        name: secureFilename,
        originalName: originalFilename,
        filePath,
        fileSize: fileBuffer.length,
        mimeType: validation.mimeType,
        fileHash,
        metadata: JSON.stringify(metadata),
        tags: JSON.stringify(tags),
        version: 1,
        isActive: true,
        uploadedAt: new Date(),
      });

      const autoTags = await this.autoTagDocument(document, metadata);
      if (autoTags.length > 0) {
        const updatedTags = [...tags, ...autoTags];
        await document.update({ tags: JSON.stringify(updatedTags) });
      }

      await Application.update(
        { lastUpdated: new Date() },
        { where: { id: applicationId } }
      );

      return {
        success: true,
        data: document,
        metadata,
        autoTags,
        message: "Document uploaded successfully",
      };
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }

  static validateFile(fileBuffer, filename) {
    console.log("In validateFile, fileBuffer:", fileBuffer);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".rtf": "application/rtf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    };

    if (fileBuffer.length > maxSize) {
      return {
        valid: false,
        error: "File size exceeds 10MB limit",
      };
    }

    const extension = path.extname(filename).toLowerCase();
    if (!allowedTypes[extension]) {
      return {
        valid: false,
        error: "File type not allowed. Supported types: PDF, DOC, DOCX, TXT, RTF, JPG, PNG, GIF",
      };
    }

    const signature = fileBuffer.slice(0, 4).toString("hex");
    const validSignatures = {
      "25504446": "application/pdf",
      d0cf11e0: "application/msword",
      "504b0304": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ffd8ffe0: "image/jpeg",
      ffd8ffe1: "image/jpeg",
      "89504e47": "image/png",
      "47494638": "image/gif",
    };

    return {
      valid: true,
      mimeType: allowedTypes[extension],
      detectedType: validSignatures[signature] || allowedTypes[extension],
    };
  }

  static async extractFileMetadata(fileBuffer, filename) {
    const metadata = {
      size: fileBuffer.length,
      extension: path.extname(filename).toLowerCase(),
      uploadDate: new Date().toISOString(),
      checksum: crypto.createHash("md5").update(fileBuffer).digest("hex"),
    };

    const extension = metadata.extension;

    if (extension === ".pdf") {
      metadata.isPDF = true;
      metadata.estimatedPages = Math.ceil(fileBuffer.length / 50000);
    } else if ([".jpg", ".jpeg", ".png", ".gif"].includes(extension)) {
      metadata.isImage = true;
      metadata.estimatedDimensions = "Unknown";
    } else if ([".doc", ".docx", ".txt", ".rtf"].includes(extension)) {
      metadata.isDocument = true;
      metadata.estimatedWordCount = Math.ceil(fileBuffer.length / 6);
    }

    return metadata;
  }

  static async autoTagDocument(document, metadata) {
    const autoTags = [];
    const filename = document.originalName.toLowerCase();
    const type = document.type;

    if (type === "resume") {
      autoTags.push("resume", "cv", "profile");
    } else if (type === "cover_letter") {
      autoTags.push("cover-letter", "application-letter");
    } else if (type === "portfolio") {
      autoTags.push("portfolio", "work-samples");
    }

    if (filename.includes("resume") || filename.includes("cv")) {
      autoTags.push("resume");
    }
    if (filename.includes("cover") || filename.includes("letter")) {
      autoTags.push("cover-letter");
    }
    if (filename.includes("portfolio") || filename.includes("sample")) {
      autoTags.push("portfolio");
    }
    if (filename.includes("transcript") || filename.includes("grade")) {
      autoTags.push("academic");
    }
    if (filename.includes("certificate") || filename.includes("certification")) {
      autoTags.push("certification");
    }

    if (metadata.isPDF) {
      autoTags.push("pdf");
    }
    if (metadata.isImage) {
      autoTags.push("image");
    }
    if (metadata.isDocument) {
      autoTags.push("document");
    }

    if (document.fileSize > 5 * 1024 * 1024) {
      // > 5MB
      autoTags.push("large-file");
    }

    return [...new Set(autoTags)];
  }

  static generateDocumentTitle(type, filename) {
    const baseName = path.basename(filename, path.extname(filename));
    const typeLabels = {
      resume: "Resume",
      cover_letter: "Cover Letter",
      portfolio: "Portfolio",
      transcript: "Transcript",
      certificate: "Certificate",
      reference: "Reference",
      other: "Document",
    };

    const typeLabel = typeLabels[type] || "Document";
    return `${typeLabel} - ${baseName}`;
  }

  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async searchDocuments(userId, query) {
    return { success: true, data: [] };
  }

  static async organizeDocuments(userId) {
    return { success: true, data: {} };
  }

  static async getDocumentAnalytics(userId) {
    return { success: true, data: {} };
  }
}

module.exports = DocumentManagementService;

