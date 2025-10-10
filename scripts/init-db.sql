-- SparkApply Database Initialization Script
-- This script sets up the initial database structure for development

-- Create additional databases for testing
CREATE DATABASE sparkapply_test;
CREATE DATABASE sparkapply_staging;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sparkapply_dev TO sparkapply;
GRANT ALL PRIVILEGES ON DATABASE sparkapply_test TO sparkapply;
GRANT ALL PRIVILEGES ON DATABASE sparkapply_staging TO sparkapply;

-- Connect to the main development database
\c sparkapply_dev;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial tables (these will be managed by Sequelize migrations in production)
-- This is just for development convenience

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_type VARCHAR(50) NOT NULL DEFAULT 'job_seeker',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_completion INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job Seeker Profiles table
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    location VARCHAR(255),
    bio TEXT,
    skills JSONB,
    experience_level VARCHAR(50),
    preferred_job_types JSONB,
    preferred_locations JSONB,
    salary_expectation JSONB,
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON job_seeker_profiles(user_id);

-- Insert some sample data for development
INSERT INTO users (email, password_hash, first_name, last_name, user_type, is_verified, profile_completion) 
VALUES 
    ('john.doe@example.com', '$2a$10$example.hash.for.development', 'John', 'Doe', 'job_seeker', true, 75),
    ('jane.smith@example.com', '$2a$10$example.hash.for.development', 'Jane', 'Smith', 'job_seeker', true, 90)
ON CONFLICT (email) DO NOTHING;

-- Connect to test database and create similar structure
\c sparkapply_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Repeat table creation for test database
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_type VARCHAR(50) NOT NULL DEFAULT 'job_seeker',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_completion INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    location VARCHAR(255),
    bio TEXT,
    skills JSONB,
    experience_level VARCHAR(50),
    preferred_job_types JSONB,
    preferred_locations JSONB,
    salary_expectation JSONB,
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for test database
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON job_seeker_profiles(user_id);

-- Add health check functionality
\c sparkapply_dev;

-- Create a simple health check table
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'healthy',
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health check records
INSERT INTO health_check (service_name, status) VALUES 
    ('user-service', 'healthy'),
    ('job-service', 'healthy'),
    ('application-service', 'healthy'),
    ('database-init', 'completed')
ON CONFLICT DO NOTHING;

-- Grant additional permissions for health checks
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sparkapply;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sparkapply;
