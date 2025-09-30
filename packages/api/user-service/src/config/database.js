import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sparkapply',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Database initialization
export const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        role VARCHAR(50) DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'employer', 'institution', 'admin')),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create job seeker profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_seeker_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        location VARCHAR(255),
        bio TEXT,
        resume_url VARCHAR(500),
        linkedin_url VARCHAR(500),
        github_url VARCHAR(500),
        portfolio_url VARCHAR(500),
        years_experience INTEGER DEFAULT 0,
        salary_expectation INTEGER,
        job_preferences JSONB DEFAULT '{}',
        skills JSONB DEFAULT '[]',
        education JSONB DEFAULT '[]',
        experience JSONB DEFAULT '[]',
        profile_completion_percentage INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create employer profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        company_description TEXT,
        company_website VARCHAR(500),
        company_size VARCHAR(50),
        industry VARCHAR(100),
        location VARCHAR(255),
        logo_url VARCHAR(500),
        contact_person VARCHAR(255),
        contact_phone VARCHAR(20),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create institution profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS institution_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        institution_name VARCHAR(255) NOT NULL,
        institution_type VARCHAR(100),
        location VARCHAR(255),
        website VARCHAR(500),
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        student_count INTEGER,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON job_seeker_profiles(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON employer_profiles(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_institution_profiles_user_id ON institution_profiles(user_id)');

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

export default pool;
