const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobMatch = sequelize.define('JobMatch', {
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
  compatibility_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Overall compatibility score from 0.00 to 1.00',
  },
  skills_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Skills matching score',
  },
  experience_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Experience level matching score',
  },
  location_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Location preference matching score',
  },
  salary_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Salary expectation matching score',
  },
  culture_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Company culture matching score',
  },
  match_factors: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Detailed breakdown of matching factors',
  },
  user_action: {
    type: DataTypes.ENUM('liked', 'disliked', 'applied', 'saved', 'ignored', 'viewed'),
    allowNull: true,
    comment: 'User action taken on this job match',
  },
  action_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when user action was taken',
  },
  recommendation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI-generated reason for recommendation',
  },
  match_version: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Version of the matching algorithm used',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this match is still active/relevant',
  },
  shown_to_user: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this match has been shown to the user',
  },
  shown_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when match was first shown to user',
  },
  feedback_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
    comment: 'User feedback score for match quality (1-5)',
  },
  feedback_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User feedback text about match quality',
  },
}, {
  tableName: 'job_matches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id'],
      name: 'job_matches_user_id_idx',
    },
    {
      fields: ['job_id'],
      name: 'job_matches_job_id_idx',
    },
    {
      fields: ['compatibility_score'],
      name: 'job_matches_compatibility_score_idx',
    },
    {
      fields: ['user_action'],
      name: 'job_matches_user_action_idx',
    },
    {
      fields: ['action_date'],
      name: 'job_matches_action_date_idx',
    },
    {
      fields: ['is_active'],
      name: 'job_matches_is_active_idx',
    },
    {
      fields: ['shown_to_user'],
      name: 'job_matches_shown_to_user_idx',
    },
    {
      fields: ['shown_date'],
      name: 'job_matches_shown_date_idx',
    },
    {
      fields: ['match_version'],
      name: 'job_matches_match_version_idx',
    },
    {
      fields: ['user_id', 'job_id'],
      name: 'job_matches_user_job_unique_idx',
      unique: true,
    },
    {
      fields: ['user_id', 'compatibility_score'],
      name: 'job_matches_user_score_idx',
    },
    {
      fields: ['user_id', 'user_action'],
      name: 'job_matches_user_action_idx',
    },
    {
      fields: ['user_id', 'shown_to_user', 'is_active'],
      name: 'job_matches_user_shown_active_idx',
    },
  ],
  hooks: {
    beforeCreate: (jobMatch) => {
      // Set shown_date if shown_to_user is true
      if (jobMatch.shown_to_user && !jobMatch.shown_date) {
        jobMatch.shown_date = new Date();
      }
    },
    beforeUpdate: (jobMatch) => {
      // Set action_date when user_action changes
      if (jobMatch.changed('user_action') && jobMatch.user_action) {
        jobMatch.action_date = new Date();
      }
      
      // Set shown_date when shown_to_user changes to true
      if (jobMatch.changed('shown_to_user') && jobMatch.shown_to_user && !jobMatch.shown_date) {
        jobMatch.shown_date = new Date();
      }
    },
  },
});

// Instance methods
JobMatch.prototype.recordUserAction = async function(action, feedback = null) {
  this.user_action = action;
  this.action_date = new Date();
  
  if (feedback) {
    this.feedback_score = feedback.score;
    this.feedback_text = feedback.text;
  }
  
  // Mark as shown if not already
  if (!this.shown_to_user) {
    this.shown_to_user = true;
    this.shown_date = new Date();
  }
  
  await this.save();
  return this;
};

JobMatch.prototype.markAsShown = async function() {
  if (!this.shown_to_user) {
    this.shown_to_user = true;
    this.shown_date = new Date();
    await this.save();
  }
  return this;
};

JobMatch.prototype.getMatchQuality = function() {
  if (this.compatibility_score >= 0.8) return 'excellent';
  if (this.compatibility_score >= 0.6) return 'good';
  if (this.compatibility_score >= 0.4) return 'fair';
  return 'poor';
};

JobMatch.prototype.getScoreBreakdown = function() {
  return {
    overall: this.compatibility_score,
    skills: this.skills_score,
    experience: this.experience_score,
    location: this.location_score,
    salary: this.salary_score,
    culture: this.culture_score,
  };
};

JobMatch.prototype.getDaysSinceShown = function() {
  if (!this.shown_date) return null;
  const now = new Date();
  const shownDate = new Date(this.shown_date);
  const diffTime = now - shownDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

JobMatch.prototype.getDaysSinceAction = function() {
  if (!this.action_date) return null;
  const now = new Date();
  const actionDate = new Date(this.action_date);
  const diffTime = now - actionDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

JobMatch.prototype.isPositiveAction = function() {
  const positiveActions = ['liked', 'applied', 'saved'];
  return positiveActions.includes(this.user_action);
};

JobMatch.prototype.isNegativeAction = function() {
  const negativeActions = ['disliked', 'ignored'];
  return negativeActions.includes(this.user_action);
};

// Class methods
JobMatch.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
    },
    order: [['compatibility_score', 'DESC']],
    ...options,
  });
};

JobMatch.findTopMatches = function(userId, limit = 10, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
      shown_to_user: false,
    },
    order: [['compatibility_score', 'DESC']],
    limit,
    ...options,
  });
};

JobMatch.findByJob = function(jobId, options = {}) {
  return this.findAll({
    where: {
      job_id: jobId,
      is_active: true,
    },
    order: [['compatibility_score', 'DESC']],
    ...options,
  });
};

JobMatch.findByAction = function(userId, action, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      user_action: action,
    },
    order: [['action_date', 'DESC']],
    ...options,
  });
};

JobMatch.findLikedJobs = function(userId, options = {}) {
  return this.findByAction(userId, 'liked', options);
};

JobMatch.findSavedJobs = function(userId, options = {}) {
  return this.findByAction(userId, 'saved', options);
};

JobMatch.findAppliedJobs = function(userId, options = {}) {
  return this.findByAction(userId, 'applied', options);
};

JobMatch.findUnshownMatches = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
      shown_to_user: false,
    },
    order: [['compatibility_score', 'DESC']],
    ...options,
  });
};

JobMatch.findHighQualityMatches = function(userId, minScore = 0.7, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
      compatibility_score: {
        [sequelize.Sequelize.Op.gte]: minScore,
      },
    },
    order: [['compatibility_score', 'DESC']],
    ...options,
  });
};

JobMatch.findRecentActions = function(userId, days = 7, options = {}) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.findAll({
    where: {
      user_id: userId,
      action_date: {
        [sequelize.Sequelize.Op.gte]: cutoffDate,
      },
    },
    order: [['action_date', 'DESC']],
    ...options,
  });
};

JobMatch.getMatchingStats = async function(userId) {
  const totalMatches = await this.count({
    where: { user_id: userId, is_active: true },
  });
  
  const shownMatches = await this.count({
    where: { user_id: userId, is_active: true, shown_to_user: true },
  });
  
  const actionedMatches = await this.count({
    where: {
      user_id: userId,
      user_action: {
        [sequelize.Sequelize.Op.not]: null,
      },
    },
  });
  
  const likedMatches = await this.count({
    where: { user_id: userId, user_action: 'liked' },
  });
  
  const appliedMatches = await this.count({
    where: { user_id: userId, user_action: 'applied' },
  });
  
  return {
    total: totalMatches,
    shown: shownMatches,
    actioned: actionedMatches,
    liked: likedMatches,
    applied: appliedMatches,
    actionRate: shownMatches > 0 ? (actionedMatches / shownMatches) * 100 : 0,
    likeRate: actionedMatches > 0 ? (likedMatches / actionedMatches) * 100 : 0,
    applicationRate: likedMatches > 0 ? (appliedMatches / likedMatches) * 100 : 0,
  };
};

module.exports = JobMatch;
