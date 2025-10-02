const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  external_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
    comment: 'External ID from job boards (LinkedIn, Indeed, etc.)',
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500],
    },
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id',
    },
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  remote_type: {
    type: DataTypes.ENUM('remote', 'hybrid', 'on_site'),
    allowNull: false,
    defaultValue: 'on_site',
  },
  employment_type: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary'),
    allowNull: false,
    defaultValue: 'full_time',
  },
  experience_level: {
    type: DataTypes.ENUM('entry', 'mid', 'senior', 'executive'),
    allowNull: false,
    defaultValue: 'mid',
  },
  salary_min: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  salary_max: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  salary_currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
    validate: {
      len: [3, 3],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  benefits: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  skills: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of required skills',
  },
  categories: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Job categories/tags',
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'manual',
    comment: 'Source of the job posting (linkedin, indeed, company_website, manual)',
  },
  source_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  posted_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expires_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  view_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  application_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  quality_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.00,
      max: 1.00,
    },
    comment: 'Quality score from 0.00 to 1.00',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID of the job creator (for manual postings)',
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID of the last updater',
  },
}, {
  tableName: 'jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['title'],
      name: 'jobs_title_idx',
    },
    {
      fields: ['company_name'],
      name: 'jobs_company_name_idx',
    },
    {
      fields: ['location'],
      name: 'jobs_location_idx',
    },
    {
      fields: ['remote_type'],
      name: 'jobs_remote_type_idx',
    },
    {
      fields: ['employment_type'],
      name: 'jobs_employment_type_idx',
    },
    {
      fields: ['experience_level'],
      name: 'jobs_experience_level_idx',
    },
    {
      fields: ['is_active'],
      name: 'jobs_is_active_idx',
    },
    {
      fields: ['posted_date'],
      name: 'jobs_posted_date_idx',
    },
    {
      fields: ['expires_date'],
      name: 'jobs_expires_date_idx',
    },
    {
      fields: ['source'],
      name: 'jobs_source_idx',
    },
    {
      fields: ['skills'],
      using: 'gin',
      name: 'jobs_skills_gin_idx',
    },
    {
      fields: ['categories'],
      using: 'gin',
      name: 'jobs_categories_gin_idx',
    },
    {
      fields: ['salary_min', 'salary_max'],
      name: 'jobs_salary_range_idx',
    },
  ],
  hooks: {
    beforeValidate: (job) => {
      // Ensure salary_max is greater than salary_min
      if (job.salary_min && job.salary_max && job.salary_min > job.salary_max) {
        throw new Error('Salary minimum cannot be greater than salary maximum');
      }
      
      // Set posted_date to current date if not provided
      if (!job.posted_date) {
        job.posted_date = new Date();
      }
      
      // Set expires_date to 30 days from posted_date if not provided
      if (!job.expires_date && job.posted_date) {
        job.expires_date = new Date(job.posted_date.getTime() + (30 * 24 * 60 * 60 * 1000));
      }
    },
    beforeCreate: (job) => {
      // Generate external_id if not provided
      if (!job.external_id) {
        job.external_id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    },
  },
});

// Instance methods
Job.prototype.incrementViewCount = async function() {
  this.view_count += 1;
  await this.save();
  return this.view_count;
};

Job.prototype.incrementApplicationCount = async function() {
  this.application_count += 1;
  await this.save();
  return this.application_count;
};

Job.prototype.isExpired = function() {
  return this.expires_date && new Date() > this.expires_date;
};

Job.prototype.getDaysUntilExpiry = function() {
  if (!this.expires_date) return null;
  const now = new Date();
  const expiry = new Date(this.expires_date);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Job.prototype.getSalaryRange = function() {
  if (!this.salary_min && !this.salary_max) return null;
  
  const formatSalary = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.salary_currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  if (this.salary_min && this.salary_max) {
    return `${formatSalary(this.salary_min)} - ${formatSalary(this.salary_max)}`;
  } else if (this.salary_min) {
    return `From ${formatSalary(this.salary_min)}`;
  } else {
    return `Up to ${formatSalary(this.salary_max)}`;
  }
};

// Class methods
Job.findActiveJobs = function(options = {}) {
  return this.findAll({
    where: {
      is_active: true,
      expires_date: {
        [sequelize.Sequelize.Op.gt]: new Date(),
      },
    },
    ...options,
  });
};

Job.findBySkills = function(skills, options = {}) {
  return this.findAll({
    where: {
      skills: {
        [sequelize.Sequelize.Op.overlap]: skills,
      },
      is_active: true,
    },
    ...options,
  });
};

Job.findByLocation = function(location, options = {}) {
  return this.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        {
          location: {
            [sequelize.Sequelize.Op.iLike]: `%${location}%`,
          },
        },
        {
          remote_type: 'remote',
        },
      ],
      is_active: true,
    },
    ...options,
  });
};

module.exports = Job;
