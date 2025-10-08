const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  applicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'application_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  type: {
    type: DataTypes.ENUM(
      'resume',
      'cover_letter',
      'portfolio',
      'transcript',
      'certificate',
      'reference_letter',
      'writing_sample',
      'other'
    ),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'original_name'
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_path'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size'
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  uploadedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'uploaded_at'
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_accessed_at'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'download_count'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_public'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['application_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Document;
