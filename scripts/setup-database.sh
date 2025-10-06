#!/bin/bash

# SparkApply Database Setup Script
# This script sets up the PostgreSQL database for development

echo "🚀 Setting up SparkApply database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration (matches docker-compose.dev.yml)
DB_USER="sparkapply"
DB_PASSWORD="sparkapply_dev_password"
DB_NAME="sparkapply_dev"
DB_TEST="sparkapply_test"
DB_STAGING="sparkapply_staging"

echo -e "${YELLOW}Database Configuration:${NC}"
echo "User: $DB_USER"
echo "Password: $DB_PASSWORD"
echo "Databases: $DB_NAME, $DB_TEST, $DB_STAGING"
echo ""

# Function to run PostgreSQL commands
run_psql() {
    if command -v psql &> /dev/null; then
        echo -e "${YELLOW}Using local PostgreSQL...${NC}"
        sudo -u postgres psql -c "$1"
    elif command -v docker &> /dev/null && docker ps | grep -q postgres; then
        echo -e "${YELLOW}Using Docker PostgreSQL...${NC}"
        docker exec -it sparkapply-postgres psql -U postgres -c "$1"
    else
        echo -e "${RED}❌ PostgreSQL not found. Please install PostgreSQL or start Docker containers.${NC}"
        exit 1
    fi
}

# Create user
echo -e "${YELLOW}Creating database user...${NC}"
run_psql "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"

# Create databases
echo -e "${YELLOW}Creating databases...${NC}"
run_psql "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_NAME already exists"
run_psql "CREATE DATABASE $DB_TEST OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_TEST already exists"
run_psql "CREATE DATABASE $DB_STAGING OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_STAGING already exists"

# Grant privileges
echo -e "${YELLOW}Granting privileges...${NC}"
run_psql "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
run_psql "GRANT ALL PRIVILEGES ON DATABASE $DB_TEST TO $DB_USER;"
run_psql "GRANT ALL PRIVILEGES ON DATABASE $DB_STAGING TO $DB_USER;"

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if command -v node &> /dev/null; then
    cd "$(dirname "$0")/.."
    
    # Test user-service connection
    if [ -f "packages/api/user-service/.env" ]; then
        echo "Testing user-service connection..."
        cd packages/api/user-service
        node -e "
        require('dotenv').config();
        const { Sequelize } = require('sequelize');
        const sequelize = new Sequelize(
          process.env.POSTGRES_DB || '$DB_NAME',
          process.env.POSTGRES_USER || '$DB_USER',
          process.env.POSTGRES_PASSWORD || '$DB_PASSWORD',
          {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            dialect: 'postgres',
            logging: false
          }
        );
        sequelize.authenticate()
          .then(() => console.log('✅ User-service database connection successful!'))
          .catch(e => console.error('❌ User-service connection failed:', e.message));
        " 2>/dev/null || echo "⚠️  Install dependencies first: npm install"
        cd ../../..
    fi
    
    # Test job-service connection
    if [ -f "packages/api/job-service/.env" ]; then
        echo "Testing job-service connection..."
        cd packages/api/job-service
        node -e "
        require('dotenv').config();
        const { Sequelize } = require('sequelize');
        const sequelize = new Sequelize(
          process.env.POSTGRES_DB || '$DB_NAME',
          process.env.POSTGRES_USER || '$DB_USER',
          process.env.POSTGRES_PASSWORD || '$DB_PASSWORD',
          {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            dialect: 'postgres',
            logging: false
          }
        );
        sequelize.authenticate()
          .then(() => console.log('✅ Job-service database connection successful!'))
          .catch(e => console.error('❌ Job-service connection failed:', e.message));
        " 2>/dev/null || echo "⚠️  Install dependencies first: npm install"
        cd ../../..
    fi
else
    echo "⚠️  Node.js not found. Skipping connection test."
fi

echo ""
echo -e "${GREEN}✅ Database setup completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy .env.example to .env in each service:"
echo "   cp packages/api/user-service/.env.example packages/api/user-service/.env"
echo "   cp packages/api/job-service/.env.example packages/api/job-service/.env"
echo ""
echo "2. Install dependencies:"
echo "   cd packages/api/user-service && npm install"
echo "   cd packages/api/job-service && npm install"
echo ""
echo "3. Start your services:"
echo "   npm run dev"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
