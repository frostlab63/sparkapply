const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const redis = require('redis');
require('dotenv').config();

// PostgreSQL Configuration
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'sparkapply_dev',
  process.env.POSTGRES_USER || 'sparkapply',
  process.env.POSTGRES_PASSWORD || 'sparkapply_dev_password',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  }
);

// MongoDB Configuration
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sparkapply_jobs';
    await mongoose.connect(mongoUri, mongooseOptions);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Redis Configuration
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

// Database connection functions
const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
    }
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

// Initialize all database connections
const initializeDatabases = async () => {
  await Promise.all([
    connectPostgreSQL(),
    connectMongoDB(),
    connectRedis(),
  ]);
};

module.exports = {
  sequelize,
  mongoose,
  redisClient,
  initializeDatabases,
  connectPostgreSQL,
  connectMongoDB,
  connectRedis,
};
