// Simple database connection test script
require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
  try {
    const sequelize = new Sequelize(
      process.env.DATABASE_URL || 
      `postgresql://${process.env.POSTGRES_USER || 'sparkapply'}:${process.env.POSTGRES_PASSWORD || 'sparkapply_dev_password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'sparkapply_dev'}`
    );
    
    await sequelize.authenticate();
    console.log('SUCCESS');
    process.exit(0);
  } catch (error) {
    console.log('FAILED: ' + error.message);
    process.exit(1);
  }
}

testConnection();
