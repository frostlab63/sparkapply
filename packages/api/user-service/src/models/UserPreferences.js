const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPreferences = sequelize.define('UserPreferences', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  email_notifications: {
    type: DataTypes.JSON,
    defaultValue: {
      job_matches: true,
      application_updates: true,
      profile_views: true,
      marketing: false,
      security_alerts: true,
      weekly_digest: true,
      recruiter_messages: true,
      interview_reminders: true,
    },
    validate: {
      isValidEmailNotifications(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Email notifications must be an object');
        }
      },
    },
  },
  privacy_settings: {
    type: DataTypes.JSON,
    defaultValue: {
      profile_visibility: 'public', // public, private, recruiter_only
      show_contact_info: false,
      allow_recruiter_contact: true,
      show_salary_expectations: false,
      show_location: true,
      show_experience: true,
      show_education: true,
      allow_profile_download: false,
    },
    validate: {
      isValidPrivacySettings(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Privacy settings must be an object');
        }
        
        const validVisibilityValues = ['public', 'private', 'recruiter_only'];
        if (value.profile_visibility && !validVisibilityValues.includes(value.profile_visibility)) {
          throw new Error('Invalid profile visibility value');
        }
      },
    },
  },
  job_alert_preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      frequency: 'daily', // immediate, daily, weekly, never
      keywords: [],
      locations: [],
      salary_range: {
        min: null,
        max: null,
        currency: 'USD',
      },
      job_types: [], // full_time, part_time, contract, internship
      industries: [],
      experience_levels: [], // entry, mid, senior, executive
      work_arrangements: [], // remote, hybrid, on_site
      company_sizes: [], // startup, small, medium, large, enterprise
    },
    validate: {
      isValidJobAlertPreferences(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Job alert preferences must be an object');
        }
        
        const validFrequencies = ['immediate', 'daily', 'weekly', 'never'];
        if (value.frequency && !validFrequencies.includes(value.frequency)) {
          throw new Error('Invalid job alert frequency');
        }
      },
    },
  },
  ui_preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      theme: 'light', // light, dark, auto
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY', // MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
      time_format: '12h', // 12h, 24h
      currency: 'USD',
      items_per_page: 20,
      show_onboarding: true,
      compact_view: false,
    },
    validate: {
      isValidUIPreferences(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('UI preferences must be an object');
        }
        
        const validThemes = ['light', 'dark', 'auto'];
        if (value.theme && !validThemes.includes(value.theme)) {
          throw new Error('Invalid theme value');
        }
        
        const validTimeFormats = ['12h', '24h'];
        if (value.time_format && !validTimeFormats.includes(value.time_format)) {
          throw new Error('Invalid time format value');
        }
      },
    },
  },
}, {
  tableName: 'user_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id'],
      unique: true,
    },
  ],
});

// Instance methods
UserPreferences.prototype.updateEmailNotifications = function(notifications) {
  const currentNotifications = this.email_notifications || {};
  const updatedNotifications = {
    ...currentNotifications,
    ...notifications,
  };
  
  return this.update({ email_notifications: updatedNotifications });
};

UserPreferences.prototype.updatePrivacySettings = function(settings) {
  const currentSettings = this.privacy_settings || {};
  const updatedSettings = {
    ...currentSettings,
    ...settings,
  };
  
  return this.update({ privacy_settings: updatedSettings });
};

UserPreferences.prototype.updateJobAlertPreferences = function(preferences) {
  const currentPreferences = this.job_alert_preferences || {};
  const updatedPreferences = {
    ...currentPreferences,
    ...preferences,
  };
  
  return this.update({ job_alert_preferences: updatedPreferences });
};

UserPreferences.prototype.updateUIPreferences = function(preferences) {
  const currentPreferences = this.ui_preferences || {};
  const updatedPreferences = {
    ...currentPreferences,
    ...preferences,
  };
  
  return this.update({ ui_preferences: updatedPreferences });
};

UserPreferences.prototype.getNotificationSettings = function() {
  return this.email_notifications || {};
};

UserPreferences.prototype.getPrivacySettings = function() {
  return this.privacy_settings || {};
};

UserPreferences.prototype.getJobAlertSettings = function() {
  return this.job_alert_preferences || {};
};

UserPreferences.prototype.getUISettings = function() {
  return this.ui_preferences || {};
};

UserPreferences.prototype.isNotificationEnabled = function(notificationType) {
  const notifications = this.email_notifications || {};
  return notifications[notificationType] === true;
};

UserPreferences.prototype.isProfilePublic = function() {
  const privacy = this.privacy_settings || {};
  return privacy.profile_visibility === 'public';
};

UserPreferences.prototype.allowsRecruiterContact = function() {
  const privacy = this.privacy_settings || {};
  return privacy.allow_recruiter_contact === true;
};

UserPreferences.prototype.getJobAlertFrequency = function() {
  const jobAlerts = this.job_alert_preferences || {};
  return jobAlerts.frequency || 'daily';
};

// Class methods
UserPreferences.findByUserId = function(userId) {
  return this.findOne({ where: { user_id: userId } });
};

UserPreferences.findOrCreateByUserId = async function(userId) {
  const [preferences, created] = await this.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId },
  });
  
  return { preferences, created };
};

UserPreferences.getDefaultPreferences = function() {
  return {
    email_notifications: {
      job_matches: true,
      application_updates: true,
      profile_views: true,
      marketing: false,
      security_alerts: true,
      weekly_digest: true,
      recruiter_messages: true,
      interview_reminders: true,
    },
    privacy_settings: {
      profile_visibility: 'public',
      show_contact_info: false,
      allow_recruiter_contact: true,
      show_salary_expectations: false,
      show_location: true,
      show_experience: true,
      show_education: true,
      allow_profile_download: false,
    },
    job_alert_preferences: {
      frequency: 'daily',
      keywords: [],
      locations: [],
      salary_range: {
        min: null,
        max: null,
        currency: 'USD',
      },
      job_types: [],
      industries: [],
      experience_levels: [],
      work_arrangements: [],
      company_sizes: [],
    },
    ui_preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      currency: 'USD',
      items_per_page: 20,
      show_onboarding: true,
      compact_view: false,
    },
  };
};

UserPreferences.getUsersWithJobAlerts = function(frequency = 'daily') {
  return this.findAll({
    where: {
      job_alert_preferences: {
        frequency: frequency,
      },
    },
    include: [
      {
        model: require('./User'),
        as: 'user',
        where: { is_active: true },
      },
    ],
  });
};

UserPreferences.getUsersWithNotificationEnabled = function(notificationType) {
  return this.findAll({
    where: {
      [`email_notifications.${notificationType}`]: true,
    },
    include: [
      {
        model: require('./User'),
        as: 'user',
        where: { is_active: true },
      },
    ],
  });
};

module.exports = UserPreferences;
