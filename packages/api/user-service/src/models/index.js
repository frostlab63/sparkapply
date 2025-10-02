const { sequelize } = require('../config/database');
const User = require('./User');
const JobSeekerProfile = require('./JobSeekerProfile');
const UserFile = require('./UserFile');
const UserActivityLog = require('./UserActivityLog');
const UserPreferences = require('./UserPreferences');

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

User.hasMany(UserFile, {
  foreignKey: 'user_id',
  as: 'files',
  onDelete: 'CASCADE',
});

UserFile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(UserActivityLog, {
  foreignKey: 'user_id',
  as: 'activityLogs',
  onDelete: 'CASCADE',
});

UserActivityLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasOne(UserPreferences, {
  foreignKey: 'user_id',
  as: 'preferences',
  onDelete: 'CASCADE',
});

UserPreferences.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  JobSeekerProfile,
  UserFile,
  UserActivityLog,
  UserPreferences,
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
