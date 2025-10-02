const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Application = sequelize.define('Application', {
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
  },
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id',
    },
  },
  status: {
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
    defaultValue: 'applied',
  },
  applied_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  cover_letter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resume_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  portfolio_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  custom_fields: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Custom application fields specific to the job',
  },
  employer_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes from the employer',
  },
  interview_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  interview_type: {
    type: DataTypes.ENUM('phone', 'video', 'in_person', 'technical', 'panel'),
    allowNull: true,
  },
  interview_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  offer_details: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Salary, benefits, start date, etc.',
  },
  rejection_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Feedback from employer to candidate',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
    comment: 'Employer rating of the candidate (1-5)',
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'direct',
    comment: 'How the application was submitted (direct, referral, etc.)',
  },
  referrer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User ID of the person who referred this candidate',
  },
  is_ai_generated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the application was AI-generated',
  },
  ai_confidence_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'AI confidence score for generated applications',
  },
  application_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Additional application metadata and tracking data',
  },
}, {
  tableName: 'applications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id'],
      name: 'applications_user_id_idx',
    },
    {
      fields: ['job_id'],
      name: 'applications_job_id_idx',
    },
    {
      fields: ['status'],
      name: 'applications_status_idx',
    },
    {
      fields: ['applied_date'],
      name: 'applications_applied_date_idx',
    },
    {
      fields: ['last_updated'],
      name: 'applications_last_updated_idx',
    },
    {
      fields: ['interview_date'],
      name: 'applications_interview_date_idx',
    },
    {
      fields: ['source'],
      name: 'applications_source_idx',
    },
    {
      fields: ['is_ai_generated'],
      name: 'applications_is_ai_generated_idx',
    },
    {
      fields: ['user_id', 'job_id'],
      name: 'applications_user_job_unique_idx',
      unique: true,
    },
    {
      fields: ['user_id', 'status'],
      name: 'applications_user_status_idx',
    },
    {
      fields: ['job_id', 'status'],
      name: 'applications_job_status_idx',
    },
  ],
  hooks: {
    beforeUpdate: (application) => {
      application.last_updated = new Date();
    },
    afterUpdate: async (application) => {
      // Log status changes for analytics
      if (application.changed('status')) {
        const ApplicationStatusLog = require('./ApplicationStatusLog');
        await ApplicationStatusLog.create({
          application_id: application.id,
          old_status: application._previousDataValues.status,
          new_status: application.status,
          changed_by: application.updated_by || null,
          changed_at: new Date(),
        });
      }
    },
  },
});

// Instance methods
Application.prototype.updateStatus = async function(newStatus, updatedBy = null, notes = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.updated_by = updatedBy;
  
  if (notes) {
    this.employer_notes = notes;
  }
  
  // Set specific dates based on status
  switch (newStatus) {
    case 'interview_scheduled':
      // Interview date should be set separately
      break;
    case 'offer_extended':
      // Offer details should be set separately
      break;
    case 'offer_accepted':
    case 'offer_declined':
    case 'rejected':
    case 'withdrawn':
      // Final statuses
      break;
  }
  
  await this.save();
  return { oldStatus, newStatus };
};

Application.prototype.scheduleInterview = async function(interviewDate, interviewType = 'video', notes = null) {
  this.status = 'interview_scheduled';
  this.interview_date = interviewDate;
  this.interview_type = interviewType;
  
  if (notes) {
    this.interview_notes = notes;
  }
  
  await this.save();
  return this;
};

Application.prototype.extendOffer = async function(offerDetails) {
  this.status = 'offer_extended';
  this.offer_details = offerDetails;
  await this.save();
  return this;
};

Application.prototype.getDaysInStatus = function() {
  const now = new Date();
  const lastUpdated = new Date(this.last_updated);
  const diffTime = now - lastUpdated;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Application.prototype.getDaysSinceApplication = function() {
  const now = new Date();
  const appliedDate = new Date(this.applied_date);
  const diffTime = now - appliedDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Application.prototype.isActive = function() {
  const activeStatuses = [
    'applied',
    'viewed',
    'screening',
    'interview_scheduled',
    'interview_completed',
    'offer_extended'
  ];
  return activeStatuses.includes(this.status);
};

Application.prototype.isFinal = function() {
  const finalStatuses = [
    'offer_accepted',
    'offer_declined',
    'rejected',
    'withdrawn'
  ];
  return finalStatuses.includes(this.status);
};

Application.prototype.getStatusDisplayName = function() {
  const statusNames = {
    applied: 'Applied',
    viewed: 'Application Viewed',
    screening: 'Under Review',
    interview_scheduled: 'Interview Scheduled',
    interview_completed: 'Interview Completed',
    offer_extended: 'Offer Extended',
    offer_accepted: 'Offer Accepted',
    offer_declined: 'Offer Declined',
    rejected: 'Not Selected',
    withdrawn: 'Application Withdrawn',
  };
  return statusNames[this.status] || this.status;
};

// Class methods
Application.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
    },
    order: [['applied_date', 'DESC']],
    ...options,
  });
};

Application.findByJob = function(jobId, options = {}) {
  return this.findAll({
    where: {
      job_id: jobId,
    },
    order: [['applied_date', 'DESC']],
    ...options,
  });
};

Application.findByStatus = function(status, options = {}) {
  return this.findAll({
    where: {
      status,
    },
    order: [['last_updated', 'DESC']],
    ...options,
  });
};

Application.findActiveApplications = function(options = {}) {
  const activeStatuses = [
    'applied',
    'viewed',
    'screening',
    'interview_scheduled',
    'interview_completed',
    'offer_extended'
  ];
  
  return this.findAll({
    where: {
      status: {
        [sequelize.Sequelize.Op.in]: activeStatuses,
      },
    },
    order: [['last_updated', 'DESC']],
    ...options,
  });
};

Application.findPendingInterviews = function(options = {}) {
  return this.findAll({
    where: {
      status: 'interview_scheduled',
      interview_date: {
        [sequelize.Sequelize.Op.gte]: new Date(),
      },
    },
    order: [['interview_date', 'ASC']],
    ...options,
  });
};

Application.findExpiredOffers = function(daysOld = 7, options = {}) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.findAll({
    where: {
      status: 'offer_extended',
      last_updated: {
        [sequelize.Sequelize.Op.lt]: cutoffDate,
      },
    },
    order: [['last_updated', 'ASC']],
    ...options,
  });
};

module.exports = Application;
