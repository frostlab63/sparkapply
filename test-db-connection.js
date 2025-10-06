// Simple database connection test script
require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  // Test with environment variables
  console.log('Environment variables:');
  console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
  console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT);
  console.log('POSTGRES_DB:', process.env.POSTGRES_DB);
  console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
  console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '***' : 'NOT SET');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('');

  // Try connection with DATABASE_URL first
  if (process.env.DATABASE_URL) {
    console.log('🔗 Testing with DATABASE_URL...');
    try {
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false
      });
      
      await sequelize.authenticate();
      console.log('✅ DATABASE_URL connection successful!');
      await sequelize.close();
      return;
    } catch (error) {
      console.log('❌ DATABASE_URL connection failed:', error.message);
    }
  }

  // Try connection with individual variables
  console.log('🔗 Testing with individual environment variables...');
  try {
    const sequelize = new Sequelize(
      process.env.POSTGRES_DB,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log('✅ Individual variables connection successful!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('📊 PostgreSQL version:', results[0].version.split(' ')[0]);
    
    await sequelize.close();
  } catch (error) {
    console.log('❌ Individual variables connection failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running: docker-compose -f docker-compose.dev.yml up -d postgres');
    console.log('2. Check if the database exists');
    console.log('3. Verify the password matches docker-compose.dev.yml');
    console.log('4. Try connecting manually: psql -h localhost -U sparkapply -d sparkapply_dev');
  }
}

testConnection().catch(console.error);
