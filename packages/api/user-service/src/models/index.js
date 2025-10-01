const { sequelize } = require('../config/database');
const User = require('./User');
const JobSeekerProfile = require('./JobSeekerProfile');

// Define associations
User.hasOne(JobSeekerProfile, {
  foreignKey: 'user_id',
  as: 'jobSeekerProfile',
  onDelete: 'CASCADE',
});

JobSeekerProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  JobSeekerProfile,
};

// Initialize database connection and sync models
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

module.exports.initializeDatabase = initializeDatabase;
