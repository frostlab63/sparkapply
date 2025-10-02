const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserFile = sequelize.define('UserFile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  file_type: {
    type: DataTypes.ENUM('resume', 'cover_letter', 'portfolio', 'certificate', 'profile_image'),
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 50 * 1024 * 1024, // 50MB max
    },
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    // Can store additional info like image dimensions, document pages, etc.
  },
}, {
  tableName: 'user_files',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['file_type'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['user_id', 'file_type'],
    },
  ],
});

// Instance methods
UserFile.prototype.getFileInfo = function() {
  return {
    id: this.id,
    type: this.file_type,
    originalName: this.original_name,
    filename: this.filename,
    url: this.file_url,
    size: this.file_size,
    mimeType: this.mime_type,
    isActive: this.is_active,
    metadata: this.metadata,
    uploadedAt: this.created_at,
  };
};

UserFile.prototype.deactivate = function() {
  return this.update({ is_active: false });
};

UserFile.prototype.activate = function() {
  return this.update({ is_active: true });
};

// Class methods
UserFile.findByUserAndType = function(userId, fileType) {
  return this.findAll({
    where: {
      user_id: userId,
      file_type: fileType,
      is_active: true,
    },
    order: [['created_at', 'DESC']],
  });
};

UserFile.findActiveByUser = function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
    },
    order: [['file_type', 'ASC'], ['created_at', 'DESC']],
  });
};

UserFile.getLatestByType = function(userId, fileType) {
  return this.findOne({
    where: {
      user_id: userId,
      file_type: fileType,
      is_active: true,
    },
    order: [['created_at', 'DESC']],
  });
};

UserFile.getTotalSizeByUser = async function(userId) {
  const result = await this.findOne({
    where: {
      user_id: userId,
      is_active: true,
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('file_size')), 'total_size'],
    ],
    raw: true,
  });
  
  return parseInt(result.total_size) || 0;
};

UserFile.getFileCountByUser = async function(userId) {
  return await this.count({
    where: {
      user_id: userId,
      is_active: true,
    },
  });
};

UserFile.getFilesByTypeAndUser = function(userId, fileType, limit = 10) {
  return this.findAll({
    where: {
      user_id: userId,
      file_type: fileType,
      is_active: true,
    },
    order: [['created_at', 'DESC']],
    limit,
  });
};

module.exports = UserFile;
