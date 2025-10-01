const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobSeekerProfile = sequelize.define('JobSeekerProfile', {
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
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/i, // Basic international phone format
    },
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
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
  linkedin_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  github_url: {
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
  years_experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 50,
    },
  },
  salary_expectation: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  job_preferences: {
    type: DataTypes.JSON,
    defaultValue: {},
    // Structure: { remote: boolean, locations: [], job_types: [], industries: [] }
  },
  skills: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Array of skill objects: [{ name: string, level: 'beginner'|'intermediate'|'advanced'|'expert' }]
  },
  education: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Array of education objects: [{ degree, institution, year, gpa? }]
  },
  experience: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Array of experience objects: [{ title, company, start_date, end_date?, description }]
  },
  certifications: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Array of certification objects: [{ name, issuer, date, url? }]
  },
  languages: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Array of language objects: [{ language, proficiency }]
  },
  availability: {
    type: DataTypes.ENUM('immediately', 'within_2_weeks', 'within_month', 'not_looking'),
    defaultValue: 'within_month',
  },
  profile_completion_percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'job_seeker_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    afterUpdate: async (profile) => {
      // Calculate profile completion percentage
      const completionFields = [
        'first_name', 'last_name', 'phone', 'location', 'bio',
        'years_experience', 'skills', 'education', 'experience'
      ];
      
      let completedFields = 0;
      completionFields.forEach(field => {
        const value = profile[field];
        if (value && (Array.isArray(value) ? value.length > 0 : value.toString().trim())) {
          completedFields++;
        }
      });
      
      const percentage = Math.round((completedFields / completionFields.length) * 100);
      if (profile.profile_completion_percentage !== percentage) {
        await profile.update({ profile_completion_percentage: percentage }, { hooks: false });
      }
    },
  },
});

// Instance methods
JobSeekerProfile.prototype.getFullName = function() {
  return `${this.first_name || ''} ${this.last_name || ''}`.trim();
};

JobSeekerProfile.prototype.addSkill = function(skill) {
  const skills = [...(this.skills || [])];
  const existingIndex = skills.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase());
  
  if (existingIndex >= 0) {
    skills[existingIndex] = skill;
  } else {
    skills.push(skill);
  }
  
  return this.update({ skills });
};

JobSeekerProfile.prototype.removeSkill = function(skillName) {
  const skills = (this.skills || []).filter(s => s.name.toLowerCase() !== skillName.toLowerCase());
  return this.update({ skills });
};

module.exports = JobSeekerProfile;
