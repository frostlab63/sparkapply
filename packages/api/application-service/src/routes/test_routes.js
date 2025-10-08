const express = require('express');
const { body, param, query } = require('express-validator');
const {
  upload,
  uploadDocument,
  updateDocumentMetadata,
} = require('../controllers/test_controller');

const router = express.Router();

// Validation middleware
const validateDocumentId = [
  param('id').isInt().withMessage('Document ID must be an integer')
];

const validateUploadDocument = [
  body('applicationId').isInt().withMessage('Application ID is required and must be an integer'),
  body('userId').isInt().withMessage('User ID is required and must be an integer'),
  body('type').isIn([
    'resume', 'cover_letter', 'portfolio', 'transcript', 'certificate', 
    'reference', 'writing_sample', 'other'
  ]).withMessage('Invalid document type'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('tags').optional().isString().withMessage('Tags must be a JSON string')
];

const validateUpdateMetadata = [
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('type').optional().isIn([
    'resume', 'cover_letter', 'portfolio', 'transcript', 'certificate', 
    'reference', 'writing_sample', 'other'
  ]).withMessage('Invalid document type')
];

// Routes

router.post('/upload',
  upload.single('document'),
  validateUploadDocument,
  uploadDocument
);

router.put('/metadata/:id',
  validateDocumentId,
  validateUpdateMetadata,
  updateDocumentMetadata
);

module.exports = router;
