const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Enhanced File Upload Service
 * Handles secure file uploads with validation and processing
 */
class FileUploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = {
      resume: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
      cover_letter: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
      portfolio: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
      ],
      certificate: [
        'application/pdf',
        'image/jpeg',
        'image/png',
      ],
      profile_image: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
    };
    
    this.initializeUploadDirectories();
  }

  /**
   * Initialize upload directories
   */
  async initializeUploadDirectories() {
    try {
      const directories = [
        'resumes',
        'cover_letters',
        'portfolios',
        'certificates',
        'profile_images',
        'temp',
      ];

      for (const dir of directories) {
        const dirPath = path.join(this.uploadDir, dir);
        await fs.mkdir(dirPath, { recursive: true });
      }

      console.log('✅ Upload directories initialized');
    } catch (error) {
      console.error('❌ Failed to initialize upload directories:', error);
    }
  }

  /**
   * Create multer storage configuration
   */
  createStorage(fileType) {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, this.getSubDirectory(fileType));
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const userId = req.user?.id || 'anonymous';
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(file.originalname);
        const filename = `${userId}_${timestamp}_${randomString}${extension}`;
        cb(null, filename);
      },
    });
  }

  /**
   * Get subdirectory for file type
   */
  getSubDirectory(fileType) {
    const subdirectories = {
      resume: 'resumes',
      cover_letter: 'cover_letters',
      portfolio: 'portfolios',
      certificate: 'certificates',
      profile_image: 'profile_images',
    };
    return subdirectories[fileType] || 'temp';
  }

  /**
   * File filter function
   */
  createFileFilter(fileType) {
    return (req, file, cb) => {
      const allowedTypes = this.allowedMimeTypes[fileType] || [];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    };
  }

  /**
   * Create multer upload middleware
   */
  createUploadMiddleware(fileType, fieldName = 'file') {
    return multer({
      storage: this.createStorage(fileType),
      fileFilter: this.createFileFilter(fileType),
      limits: {
        fileSize: this.maxFileSize,
        files: 1, // Single file upload
      },
    }).single(fieldName);
  }

  /**
   * Create multiple file upload middleware
   */
  createMultipleUploadMiddleware(fileType, fieldName = 'files', maxCount = 5) {
    return multer({
      storage: this.createStorage(fileType),
      fileFilter: this.createFileFilter(fileType),
      limits: {
        fileSize: this.maxFileSize,
        files: maxCount,
      },
    }).array(fieldName, maxCount);
  }

  /**
   * Validate uploaded file
   */
  async validateFile(filePath, fileType) {
    try {
      const stats = await fs.stat(filePath);
      
      // Check file size
      if (stats.size > this.maxFileSize) {
        throw new Error('File size exceeds maximum allowed size');
      }

      // Check if file exists and is readable
      await fs.access(filePath, fs.constants.R_OK);

      // Additional validation based on file type
      if (fileType === 'resume' || fileType === 'cover_letter') {
        await this.validateDocumentFile(filePath);
      } else if (fileType === 'profile_image') {
        await this.validateImageFile(filePath);
      }

      return true;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Validate document files (PDF, DOC, DOCX)
   */
  async validateDocumentFile(filePath) {
    // Basic validation - in production, you might want to use libraries
    // like pdf-parse or mammoth for more thorough validation
    const extension = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid document file extension');
    }
  }

  /**
   * Validate image files
   */
  async validateImageFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid image file extension');
    }

    // Check image dimensions if needed
    // You could use libraries like sharp or jimp for this
  }

  /**
   * Generate secure file URL
   */
  generateFileUrl(filename, fileType) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const subdirectory = this.getSubDirectory(fileType);
    return `${baseUrl}/api/v1/files/${subdirectory}/${filename}`;
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const filename = path.basename(filePath);
      const extension = path.extname(filePath);
      
      return {
        filename,
        extension,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
    try {
      const directories = ['temp'];
      let deletedCount = 0;

      for (const dir of directories) {
        const dirPath = path.join(this.uploadDir, dir);
        
        try {
          const files = await fs.readdir(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            
            if (Date.now() - stats.mtime.getTime() > maxAge) {
              await this.deleteFile(filePath);
              deletedCount++;
            }
          }
        } catch (error) {
          console.error(`Error cleaning directory ${dir}:`, error);
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old files`);
      return deletedCount;
    } catch (error) {
      console.error('❌ File cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Process uploaded file metadata
   */
  processFileMetadata(file, fileType) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      fileType,
      url: this.generateFileUrl(file.filename, fileType),
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle file upload errors
   */
  handleUploadError(error) {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return {
            success: false,
            message: 'File size too large',
            error: 'FILE_TOO_LARGE',
            maxSize: this.maxFileSize,
          };
        case 'LIMIT_FILE_COUNT':
          return {
            success: false,
            message: 'Too many files uploaded',
            error: 'TOO_MANY_FILES',
          };
        case 'LIMIT_UNEXPECTED_FILE':
          return {
            success: false,
            message: 'Unexpected file field',
            error: 'UNEXPECTED_FILE',
          };
        default:
          return {
            success: false,
            message: 'File upload error',
            error: 'UPLOAD_ERROR',
            details: error.message,
          };
      }
    }

    return {
      success: false,
      message: error.message || 'File upload failed',
      error: 'UPLOAD_FAILED',
    };
  }
}

module.exports = new FileUploadService();
