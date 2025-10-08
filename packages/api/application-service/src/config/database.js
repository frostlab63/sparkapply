const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sparkapply_dev',
  username: process.env.DB_USER || 'sparkapply',
  password: process.env.DB_PASSWORD || 'sparkapply123',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,
    freezeTableName: true
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

// Sync models
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing models:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncModels
};
