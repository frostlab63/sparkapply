const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApplicationStatusLog = sequelize.define('ApplicationStatusLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'applications',
      key: 'id',
    },
  },
  old_status: {
    type: DataTypes.ENUM(
      'applied',
      'viewed',
      'screening',
      'interview_scheduled',
      'interview_completed',
      'offer_extended',
      'offer_accepted',
      'offer_declined',
      'rejected',
      'withdrawn'
    ),
    allowNull: true,
    comment: 'Previous status before the change',
  },
  new_status: {
    type: DataTypes.ENUM(
      'applied',
      'viewed',
      'screening',
      'interview_scheduled',
      'interview_completed',
      'offer_extended',
      'offer_accepted',
      'offer_declined',
      'rejected',
      'withdrawn'
    ),
    allowNull: false,
    comment: 'New status after the change',
  },
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User ID who made the status change',
  },
  changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Reason for the status change',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the status change',
  },
  automated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the change was made automatically by the system',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Additional metadata about the status change',
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true,
    comment: 'IP address of the user who made the change',
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent of the browser/client that made the change',
  },
}, {
  tableName: 'application_status_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Status logs are immutable once created
  indexes: [
    {
      fields: ['application_id'],
      name: 'application_status_logs_application_id_idx',
    },
    {
      fields: ['old_status'],
      name: 'application_status_logs_old_status_idx',
    },
    {
      fields: ['new_status'],
      name: 'application_status_logs_new_status_idx',
    },
    {
      fields: ['changed_by'],
      name: 'application_status_logs_changed_by_idx',
    },
    {
      fields: ['changed_at'],
      name: 'application_status_logs_changed_at_idx',
    },
    {
      fields: ['automated'],
      name: 'application_status_logs_automated_idx',
    },
    {
      fields: ['application_id', 'changed_at'],
      name: 'application_status_logs_app_date_idx',
    },
    {
      fields: ['changed_by', 'changed_at'],
      name: 'application_status_logs_user_date_idx',
    },
  ],
  hooks: {
    beforeCreate: (log) => {
      // Ensure changed_at is set
      if (!log.changed_at) {
        log.changed_at = new Date();
      }
    },
  },
});

// Instance methods
ApplicationStatusLog.prototype.getStatusTransition = function() {
  return `${this.old_status || 'initial'} → ${this.new_status}`;
};

ApplicationStatusLog.prototype.getDuration = function() {
  // This would require finding the previous log entry
  // Implementation would depend on specific use case
  return null;
};

ApplicationStatusLog.prototype.isProgressiveChange = function() {
  const statusOrder = [
    'applied',
    'viewed',
    'screening',
    'interview_scheduled',
    'interview_completed',
    'offer_extended',
    'offer_accepted'
  ];
  
  const oldIndex = statusOrder.indexOf(this.old_status);
  const newIndex = statusOrder.indexOf(this.new_status);
  
  return newIndex > oldIndex;
};

ApplicationStatusLog.prototype.isRegressiveChange = function() {
  const statusOrder = [
    'applied',
    'viewed',
    'screening',
    'interview_scheduled',
    'interview_completed',
    'offer_extended',
    'offer_accepted'
  ];
  
  const oldIndex = statusOrder.indexOf(this.old_status);
  const newIndex = statusOrder.indexOf(this.new_status);
  
  return newIndex < oldIndex && !this.isFinalStatus();
};

ApplicationStatusLog.prototype.isFinalStatus = function() {
  const finalStatuses = ['offer_accepted', 'offer_declined', 'rejected', 'withdrawn'];
  return finalStatuses.includes(this.new_status);
};

ApplicationStatusLog.prototype.getTimeSinceChange = function() {
  const now = new Date();
  const changedAt = new Date(this.changed_at);
  const diffTime = now - changedAt;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
};

// Class methods
ApplicationStatusLog.findByApplication = function(applicationId, options = {}) {
  return this.findAll({
    where: {
      application_id: applicationId,
    },
    order: [['changed_at', 'ASC']],
    ...options,
  });
};

ApplicationStatusLog.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      changed_by: userId,
    },
    order: [['changed_at', 'DESC']],
    ...options,
  });
};

ApplicationStatusLog.findByStatus = function(status, options = {}) {
  return this.findAll({
    where: {
      new_status: status,
    },
    order: [['changed_at', 'DESC']],
    ...options,
  });
};

ApplicationStatusLog.findRecentChanges = function(days = 7, options = {}) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.findAll({
    where: {
      changed_at: {
        [sequelize.Sequelize.Op.gte]: cutoffDate,
      },
    },
    order: [['changed_at', 'DESC']],
    ...options,
  });
};

ApplicationStatusLog.findAutomatedChanges = function(options = {}) {
  return this.findAll({
    where: {
      automated: true,
    },
    order: [['changed_at', 'DESC']],
    ...options,
  });
};

ApplicationStatusLog.findStatusTransitions = function(fromStatus, toStatus, options = {}) {
  return this.findAll({
    where: {
      old_status: fromStatus,
      new_status: toStatus,
    },
    order: [['changed_at', 'DESC']],
    ...options,
  });
};

ApplicationStatusLog.getApplicationTimeline = async function(applicationId) {
  const logs = await this.findByApplication(applicationId, {
    include: [
      {
        association: 'changedBy',
        attributes: ['id', 'first_name', 'last_name', 'email'],
        required: false,
      },
    ],
  });
  
  return logs.map(log => ({
    id: log.id,
    transition: log.getStatusTransition(),
    status: log.new_status,
    changedAt: log.changed_at,
    changedBy: log.changedBy ? {
      id: log.changedBy.id,
      name: `${log.changedBy.first_name} ${log.changedBy.last_name}`,
      email: log.changedBy.email,
    } : null,
    reason: log.reason,
    notes: log.notes,
    automated: log.automated,
    isProgressive: log.isProgressiveChange(),
    isFinal: log.isFinalStatus(),
  }));
};

ApplicationStatusLog.getStatusStats = async function(options = {}) {
  const { days = 30 } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const statusCounts = await this.findAll({
    attributes: [
      'new_status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: {
      changed_at: {
        [sequelize.Sequelize.Op.gte]: cutoffDate,
      },
    },
    group: ['new_status'],
    raw: true,
  });
  
  const transitionCounts = await this.findAll({
    attributes: [
      'old_status',
      'new_status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: {
      changed_at: {
        [sequelize.Sequelize.Op.gte]: cutoffDate,
      },
    },
    group: ['old_status', 'new_status'],
    raw: true,
  });
  
  return {
    statusCounts: statusCounts.reduce((acc, item) => {
      acc[item.new_status] = parseInt(item.count);
      return acc;
    }, {}),
    transitionCounts: transitionCounts.map(item => ({
      from: item.old_status,
      to: item.new_status,
      count: parseInt(item.count),
    })),
  };
};

ApplicationStatusLog.getConversionFunnel = async function(options = {}) {
  const { days = 30 } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const statusOrder = [
    'applied',
    'viewed',
    'screening',
    'interview_scheduled',
    'interview_completed',
    'offer_extended',
    'offer_accepted'
  ];
  
  const funnelData = {};
  
  for (const status of statusOrder) {
    const count = await this.count({
      where: {
        new_status: status,
        changed_at: {
          [sequelize.Sequelize.Op.gte]: cutoffDate,
        },
      },
    });
    funnelData[status] = count;
  }
  
  // Calculate conversion rates
  const conversionRates = {};
  for (let i = 1; i < statusOrder.length; i++) {
    const currentStatus = statusOrder[i];
    const previousStatus = statusOrder[i - 1];
    
    if (funnelData[previousStatus] > 0) {
      conversionRates[`${previousStatus}_to_${currentStatus}`] = 
        (funnelData[currentStatus] / funnelData[previousStatus]) * 100;
    }
  }
  
  return {
    funnel: funnelData,
    conversionRates,
  };
};

module.exports = ApplicationStatusLog;
