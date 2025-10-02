'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add two-factor authentication fields to users table
    await queryInterface.addColumn('users', 'two_factor_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'two_factor_code', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'two_factor_expires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'two_factor_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'backup_codes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add security tracking fields
    await queryInterface.addColumn('users', 'failed_login_attempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'locked_until', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add email change fields
    await queryInterface.addColumn('users', 'new_email', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    });

    await queryInterface.addColumn('users', 'email_change_token', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'email_change_expires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Enhance job_seeker_profiles table with additional fields
    await queryInterface.addColumn('job_seeker_profiles', 'profile_image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('job_seeker_profiles', 'cover_letter_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('job_seeker_profiles', 'website_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    });

    await queryInterface.addColumn('job_seeker_profiles', 'timezone', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'UTC',
    });

    await queryInterface.addColumn('job_seeker_profiles', 'preferred_contact_method', {
      type: Sequelize.ENUM('email', 'phone', 'linkedin', 'any'),
      defaultValue: 'email',
      allowNull: false,
    });

    await queryInterface.addColumn('job_seeker_profiles', 'work_authorization', {
      type: Sequelize.ENUM('citizen', 'permanent_resident', 'work_visa', 'student_visa', 'other'),
      allowNull: true,
    });

    await queryInterface.addColumn('job_seeker_profiles', 'willing_to_relocate', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('job_seeker_profiles', 'open_to_remote', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    });

    await queryInterface.addColumn('job_seeker_profiles', 'notice_period_days', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 365,
      },
    });

    // Create user_files table for file management
    await queryInterface.createTable('user_files', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      file_type: {
        type: Sequelize.ENUM('resume', 'cover_letter', 'portfolio', 'certificate', 'profile_image'),
        allowNull: false,
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create user_activity_logs table for audit trail
    await queryInterface.createTable('user_activity_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      activity_type: {
        type: Sequelize.ENUM(
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
          'account_unlock'
        ),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45), // IPv6 support
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create user_preferences table for detailed user preferences
    await queryInterface.createTable('user_preferences', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      email_notifications: {
        type: Sequelize.JSON,
        defaultValue: {
          job_matches: true,
          application_updates: true,
          profile_views: true,
          marketing: false,
          security_alerts: true,
        },
      },
      privacy_settings: {
        type: Sequelize.JSON,
        defaultValue: {
          profile_visibility: 'public',
          show_contact_info: false,
          allow_recruiter_contact: true,
          show_salary_expectations: false,
        },
      },
      job_alert_preferences: {
        type: Sequelize.JSON,
        defaultValue: {
          frequency: 'daily',
          keywords: [],
          locations: [],
          salary_range: {},
          job_types: [],
        },
      },
      ui_preferences: {
        type: Sequelize.JSON,
        defaultValue: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          date_format: 'MM/DD/YYYY',
        },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['google_id']);
    await queryInterface.addIndex('users', ['verification_token']);
    await queryInterface.addIndex('users', ['reset_token']);
    await queryInterface.addIndex('users', ['email_change_token']);
    await queryInterface.addIndex('users', ['two_factor_code']);
    
    await queryInterface.addIndex('user_files', ['user_id']);
    await queryInterface.addIndex('user_files', ['file_type']);
    await queryInterface.addIndex('user_files', ['is_active']);
    
    await queryInterface.addIndex('user_activity_logs', ['user_id']);
    await queryInterface.addIndex('user_activity_logs', ['activity_type']);
    await queryInterface.addIndex('user_activity_logs', ['created_at']);
    
    await queryInterface.addIndex('user_preferences', ['user_id']);
    
    await queryInterface.addIndex('job_seeker_profiles', ['user_id']);
    await queryInterface.addIndex('job_seeker_profiles', ['is_public']);
    await queryInterface.addIndex('job_seeker_profiles', ['availability']);
    await queryInterface.addIndex('job_seeker_profiles', ['work_authorization']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('users', ['email']);
    await queryInterface.removeIndex('users', ['google_id']);
    await queryInterface.removeIndex('users', ['verification_token']);
    await queryInterface.removeIndex('users', ['reset_token']);
    await queryInterface.removeIndex('users', ['email_change_token']);
    await queryInterface.removeIndex('users', ['two_factor_code']);
    
    await queryInterface.removeIndex('job_seeker_profiles', ['user_id']);
    await queryInterface.removeIndex('job_seeker_profiles', ['is_public']);
    await queryInterface.removeIndex('job_seeker_profiles', ['availability']);
    await queryInterface.removeIndex('job_seeker_profiles', ['work_authorization']);

    // Drop new tables
    await queryInterface.dropTable('user_preferences');
    await queryInterface.dropTable('user_activity_logs');
    await queryInterface.dropTable('user_files');

    // Remove columns from job_seeker_profiles
    await queryInterface.removeColumn('job_seeker_profiles', 'notice_period_days');
    await queryInterface.removeColumn('job_seeker_profiles', 'open_to_remote');
    await queryInterface.removeColumn('job_seeker_profiles', 'willing_to_relocate');
    await queryInterface.removeColumn('job_seeker_profiles', 'work_authorization');
    await queryInterface.removeColumn('job_seeker_profiles', 'preferred_contact_method');
    await queryInterface.removeColumn('job_seeker_profiles', 'timezone');
    await queryInterface.removeColumn('job_seeker_profiles', 'website_url');
    await queryInterface.removeColumn('job_seeker_profiles', 'cover_letter_url');
    await queryInterface.removeColumn('job_seeker_profiles', 'profile_image_url');

    // Remove columns from users table
    await queryInterface.removeColumn('users', 'email_change_expires');
    await queryInterface.removeColumn('users', 'email_change_token');
    await queryInterface.removeColumn('users', 'new_email');
    await queryInterface.removeColumn('users', 'locked_until');
    await queryInterface.removeColumn('users', 'failed_login_attempts');
    await queryInterface.removeColumn('users', 'backup_codes');
    await queryInterface.removeColumn('users', 'two_factor_verified');
    await queryInterface.removeColumn('users', 'two_factor_expires');
    await queryInterface.removeColumn('users', 'two_factor_code');
    await queryInterface.removeColumn('users', 'two_factor_enabled');
  }
};
