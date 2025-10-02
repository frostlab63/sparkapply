const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 255],
      is: /^[a-z0-9-]+$/i, // Only alphanumeric and hyphens
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  website_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  company_size: {
    type: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  founded_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1800,
      max: new Date().getFullYear(),
    },
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0,
    },
  },
  review_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  employee_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
    },
  },
  linkedin_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  twitter_handle: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [1, 50],
    },
  },
  benefits: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of company benefits',
  },
  technologies: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of technologies used by the company',
  },
  culture_keywords: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Keywords describing company culture',
  },
  is_hiring: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID of the company creator',
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID of the last updater',
  },
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name'],
      name: 'companies_name_idx',
    },
    {
      fields: ['slug'],
      name: 'companies_slug_idx',
      unique: true,
    },
    {
      fields: ['industry'],
      name: 'companies_industry_idx',
    },
    {
      fields: ['company_size'],
      name: 'companies_size_idx',
    },
    {
      fields: ['location'],
      name: 'companies_location_idx',
    },
    {
      fields: ['is_verified'],
      name: 'companies_is_verified_idx',
    },
    {
      fields: ['is_hiring'],
      name: 'companies_is_hiring_idx',
    },
    {
      fields: ['rating'],
      name: 'companies_rating_idx',
    },
    {
      fields: ['technologies'],
      using: 'gin',
      name: 'companies_technologies_gin_idx',
    },
    {
      fields: ['benefits'],
      using: 'gin',
      name: 'companies_benefits_gin_idx',
    },
  ],
  hooks: {
    beforeValidate: (company) => {
      // Generate slug from name if not provided
      if (!company.slug && company.name) {
        company.slug = company.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
      }
      
      // Ensure slug is unique by appending a number if necessary
      // This will be handled by the unique constraint and caught in the controller
    },
    beforeCreate: (company) => {
      // Set default values
      if (!company.founded_year && company.name) {
        // Don't set a default founded year
      }
    },
  },
});

// Instance methods
Company.prototype.getJobCount = async function() {
  const Job = require('./Job');
  const count = await Job.count({
    where: {
      company_id: this.id,
      is_active: true,
    },
  });
  return count;
};

Company.prototype.getActiveJobs = async function(options = {}) {
  const Job = require('./Job');
  return await Job.findAll({
    where: {
      company_id: this.id,
      is_active: true,
    },
    ...options,
  });
};

Company.prototype.updateRating = async function(newRating) {
  // This would typically be called when a new review is added
  // For now, it's a simple average update
  const currentTotal = (this.rating || 0) * this.review_count;
  this.review_count += 1;
  this.rating = (currentTotal + newRating) / this.review_count;
  await this.save();
  return this.rating;
};

Company.prototype.addTechnology = async function(technology) {
  if (!this.technologies.includes(technology)) {
    this.technologies = [...this.technologies, technology];
    await this.save();
  }
  return this.technologies;
};

Company.prototype.addBenefit = async function(benefit) {
  if (!this.benefits.includes(benefit)) {
    this.benefits = [...this.benefits, benefit];
    await this.save();
  }
  return this.benefits;
};

Company.prototype.getCompanySize = function() {
  const sizeMapping = {
    startup: '1-10 employees',
    small: '11-50 employees',
    medium: '51-200 employees',
    large: '201-1000 employees',
    enterprise: '1000+ employees',
  };
  return sizeMapping[this.company_size] || 'Unknown';
};

// Class methods
Company.findVerified = function(options = {}) {
  return this.findAll({
    where: {
      is_verified: true,
    },
    ...options,
  });
};

Company.findHiring = function(options = {}) {
  return this.findAll({
    where: {
      is_hiring: true,
    },
    ...options,
  });
};

Company.findByIndustry = function(industry, options = {}) {
  return this.findAll({
    where: {
      industry: {
        [sequelize.Sequelize.Op.iLike]: `%${industry}%`,
      },
    },
    ...options,
  });
};

Company.findByTechnology = function(technology, options = {}) {
  return this.findAll({
    where: {
      technologies: {
        [sequelize.Sequelize.Op.contains]: [technology],
      },
    },
    ...options,
  });
};

Company.findByLocation = function(location, options = {}) {
  return this.findAll({
    where: {
      location: {
        [sequelize.Sequelize.Op.iLike]: `%${location}%`,
      },
    },
    ...options,
  });
};

Company.searchByName = function(query, options = {}) {
  return this.findAll({
    where: {
      name: {
        [sequelize.Sequelize.Op.iLike]: `%${query}%`,
      },
    },
    ...options,
  });
};

module.exports = Company;
