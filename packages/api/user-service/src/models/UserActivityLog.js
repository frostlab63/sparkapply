const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserActivityLog = sequelize.define('UserActivityLog', {
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
  activity_type: {
    type: DataTypes.ENUM(
      'login',
      'logout',
      'password_change',
      'email_change',
      'profile_update',
      'file_upload',
      'file_delete',
      '2fa_enable',
      '2fa_disable',
      'account_lock',
      'account_unlock',
      'registration',
      'email_verification',
      'password_reset',
      'skill_add',
      'skill_remove',
      'experience_add',
      'experience_update',
      'experience_remove',
      'education_add',
      'education_update',
      'education_remove',
      'preferences_update'
    ),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45), // IPv6 support
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    // Can store additional context like changed fields, file info, etc.
  },
}, {
  tableName: 'user_activity_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Activity logs are immutable
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['activity_type'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['user_id', 'activity_type'],
    },
    {
      fields: ['user_id', 'created_at'],
    },
  ],
});

// Instance methods
UserActivityLog.prototype.getActivityInfo = function() {
  return {
    id: this.id,
    userId: this.user_id,
    type: this.activity_type,
    description: this.description,
    ipAddress: this.ip_address,
    userAgent: this.user_agent,
    metadata: this.metadata,
    timestamp: this.created_at,
  };
};

// Class methods
UserActivityLog.logActivity = async function(userId, activityType, options = {}) {
  const {
    description,
    ipAddress,
    userAgent,
    metadata = {},
    req
  } = options;

  // Extract info from request if provided
  const logData = {
    user_id: userId,
    activity_type: activityType,
    description: description || this.getDefaultDescription(activityType),
    ip_address: ipAddress || (req && this.getClientIP(req)),
    user_agent: userAgent || (req && req.get('User-Agent')),
    metadata,
  };

  return await this.create(logData);
};

UserActivityLog.getDefaultDescription = function(activityType) {
  const descriptions = {
    login: 'User logged in',
    logout: 'User logged out',
    registration: 'User registered',
    password_change: 'Password changed',
    email_change: 'Email address changed',
    email_verification: 'Email address verified',
    password_reset: 'Password reset',
    profile_update: 'Profile updated',
    file_upload: 'File uploaded',
    file_delete: 'File deleted',
    '2fa_enable': 'Two-factor authentication enabled',
    '2fa_disable': 'Two-factor authentication disabled',
    account_lock: 'Account locked due to failed login attempts',
    account_unlock: 'Account unlocked',
    skill_add: 'Skill added to profile',
    skill_remove: 'Skill removed from profile',
    experience_add: 'Work experience added',
    experience_update: 'Work experience updated',
    experience_remove: 'Work experience removed',
    education_add: 'Education added',
    education_update: 'Education updated',
    education_remove: 'Education removed',
    preferences_update: 'Job preferences updated',
  };

  return descriptions[activityType] || 'Activity performed';
};

UserActivityLog.getClientIP = function(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
};

UserActivityLog.getRecentActivity = function(userId, limit = 50) {
  return this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
  });
};

UserActivityLog.getActivityByType = function(userId, activityType, limit = 20) {
  return this.findAll({
    where: {
      user_id: userId,
      activity_type: activityType,
    },
    order: [['created_at', 'DESC']],
    limit,
  });
};

UserActivityLog.getActivityInTimeRange = function(userId, startDate, endDate) {
  return this.findAll({
    where: {
      user_id: userId,
      created_at: {
        [sequelize.Op.between]: [startDate, endDate],
      },
    },
    order: [['created_at', 'DESC']],
  });
};

UserActivityLog.getLoginHistory = function(userId, limit = 10) {
  return this.findAll({
    where: {
      user_id: userId,
      activity_type: 'login',
    },
    order: [['created_at', 'DESC']],
    limit,
  });
};

UserActivityLog.getSecurityEvents = function(userId, limit = 20) {
  return this.findAll({
    where: {
      user_id: userId,
      activity_type: {
        [sequelize.Op.in]: [
          'password_change',
          'email_change',
          '2fa_enable',
          '2fa_disable',
          'account_lock',
          'account_unlock',
        ],
      },
    },
    order: [['created_at', 'DESC']],
    limit,
  });
};

UserActivityLog.getActivityStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.findAll({
    where: {
      user_id: userId,
      created_at: {
        [sequelize.Op.gte]: startDate,
      },
    },
    attributes: [
      'activity_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['activity_type'],
    raw: true,
  });

  return stats.reduce((acc, stat) => {
    acc[stat.activity_type] = parseInt(stat.count);
    return acc;
  }, {});
};

module.exports = UserActivityLog;
