const { sequelize } = require('../config/database');

// Import all models
const Job = require('./Job');
const Company = require('./Company');
const Application = require('./Application');
const JobMatch = require('./JobMatch');
const ApplicationStatusLog = require('./ApplicationStatusLog');

// Define model associations
const defineAssociations = () => {
  // Company - Job associations
  Company.hasMany(Job, {
    foreignKey: 'company_id',
    as: 'jobs',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  Job.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // Job - Application associations
  Job.hasMany(Application, {
    foreignKey: 'job_id',
    as: 'applications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Application.belongsTo(Job, {
    foreignKey: 'job_id',
    as: 'job',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // User - Application associations (User model is in user-service)
  // These will be virtual associations for now
  Application.belongsTo(sequelize.models.User || {}, {
    foreignKey: 'user_id',
    as: 'user',
    constraints: false, // Since User is in another service
  });

  // Referrer - Application associations
  Application.belongsTo(sequelize.models.User || {}, {
    foreignKey: 'referrer_id',
    as: 'referrer',
    constraints: false,
  });

  // Job - JobMatch associations
  Job.hasMany(JobMatch, {
    foreignKey: 'job_id',
    as: 'matches',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  JobMatch.belongsTo(Job, {
    foreignKey: 'job_id',
    as: 'job',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // User - JobMatch associations
  JobMatch.belongsTo(sequelize.models.User || {}, {
    foreignKey: 'user_id',
    as: 'user',
    constraints: false,
  });

  // Application - ApplicationStatusLog associations
  Application.hasMany(ApplicationStatusLog, {
    foreignKey: 'application_id',
    as: 'statusLogs',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  ApplicationStatusLog.belongsTo(Application, {
    foreignKey: 'application_id',
    as: 'application',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // ApplicationStatusLog - User associations (for changed_by)
  ApplicationStatusLog.belongsTo(sequelize.models.User || {}, {
    foreignKey: 'changed_by',
    as: 'changedBy',
    constraints: false,
  });
};

// Initialize associations
defineAssociations();

// Sync database (only in development)
const syncDatabase = async (force = false) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force, alter: !force });
      console.log('Database synchronized successfully');
    }
  } catch (error) {
    console.error('Database synchronization error:', error);
    throw error;
  }
};

// Export all models and utilities
module.exports = {
  sequelize,
  Job,
  Company,
  Application,
  JobMatch,
  ApplicationStatusLog,
  defineAssociations,
  syncDatabase,
  
  // Model collections for easier access
  models: {
    Job,
    Company,
    Application,
    JobMatch,
    ApplicationStatusLog,
  },
  
  // Database operations
  async closeConnection() {
    await sequelize.close();
  },
  
  async testConnection() {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      return true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      return false;
    }
  },
  
  // Transaction helper
  async transaction(callback) {
    const t = await sequelize.transaction();
    try {
      const result = await callback(t);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
  
  // Bulk operations helper
  async bulkCreate(model, data, options = {}) {
    return await model.bulkCreate(data, {
      validate: true,
      individualHooks: true,
      ...options,
    });
  },
  
  // Search helper with pagination
  async paginate(model, options = {}) {
    const {
      page = 1,
      limit = 20,
      where = {},
      include = [],
      order = [['created_at', 'DESC']],
      ...otherOptions
    } = options;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await model.findAndCountAll({
      where,
      include,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      ...otherOptions,
    });
    
    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
    };
  },
  
  // Full-text search helper
  async fullTextSearch(model, query, fields = [], options = {}) {
    const searchConditions = fields.map(field => ({
      [field]: {
        [sequelize.Sequelize.Op.iLike]: `%${query}%`,
      },
    }));
    
    return await model.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: searchConditions,
      },
      ...options,
    });
  },
  
  // Analytics helpers
  async getJobStats() {
    const totalJobs = await Job.count();
    const activeJobs = await Job.count({ where: { is_active: true } });
    const featuredJobs = await Job.count({ where: { is_featured: true } });
    const expiredJobs = await Job.count({
      where: {
        expires_date: {
          [sequelize.Sequelize.Op.lt]: new Date(),
        },
      },
    });
    
    return {
      total: totalJobs,
      active: activeJobs,
      featured: featuredJobs,
      expired: expiredJobs,
    };
  },
  
  async getApplicationStats() {
    const totalApplications = await Application.count();
    const activeApplications = await Application.count({
      where: {
        status: {
          [sequelize.Sequelize.Op.in]: [
            'applied', 'viewed', 'screening', 
            'interview_scheduled', 'interview_completed', 'offer_extended'
          ],
        },
      },
    });
    const successfulApplications = await Application.count({
      where: { status: 'offer_accepted' },
    });
    
    return {
      total: totalApplications,
      active: activeApplications,
      successful: successfulApplications,
      successRate: totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0,
    };
  },
  
  async getCompanyStats() {
    const totalCompanies = await Company.count();
    const verifiedCompanies = await Company.count({ where: { is_verified: true } });
    const hiringCompanies = await Company.count({ where: { is_hiring: true } });
    
    return {
      total: totalCompanies,
      verified: verifiedCompanies,
      hiring: hiringCompanies,
    };
  },
};
