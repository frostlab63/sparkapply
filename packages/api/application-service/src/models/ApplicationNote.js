const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApplicationNote = sequelize.define('ApplicationNote', {
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
      'general',
      'follow_up',
      'interview_prep',
      'research',
      'contact_log',
      'reminder',
      'feedback'
    ),
    allowNull: false,
    defaultValue: 'general'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium'
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_private'
  },
  reminderDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder_date'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_completed'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'application_notes',
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
      fields: ['reminder_date']
    },
    {
      fields: ['is_completed']
    }
  ]
});

module.exports = ApplicationNote;
