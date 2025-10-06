# 🗄️ SparkApply Database Setup Guide

## 🎯 Quick Start (Copy-Paste Commands)

### **Option 1: Automated Setup (Recommended)**
```bash
# Run the setup script
./scripts/setup-database.sh

# Copy environment files
cp packages/api/user-service/.env.example packages/api/user-service/.env
cp packages/api/job-service/.env.example packages/api/job-service/.env

# Install dependencies and test
cd packages/api/user-service && npm install && npm run dev
```

### **Option 2: Docker Setup (Easiest)**
```bash
# Start database containers
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Copy environment files
cp packages/api/user-service/.env.example packages/api/user-service/.env
cp packages/api/job-service/.env.example packages/api/job-service/.env

# Test connection
cd packages/api/user-service && npm install
node -e "require('dotenv').config(); const { Sequelize } = require('sequelize'); const sequelize = new Sequelize(process.env.DATABASE_URL); sequelize.authenticate().then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Failed:', e.message));"
```

### **Option 3: Manual PostgreSQL Setup**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update && sudo apt install postgresql postgresql-contrib

# Create user and databases
sudo -u postgres psql -c "CREATE USER sparkapply WITH PASSWORD 'sparkapply_dev_password';"
sudo -u postgres psql -c "CREATE DATABASE sparkapply_dev OWNER sparkapply;"
sudo -u postgres psql -c "CREATE DATABASE sparkapply_test OWNER sparkapply;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sparkapply_dev TO sparkapply;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sparkapply_test TO sparkapply;"
```

## 📋 Database Configuration

### **Credentials (Development)**
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `sparkapply`
- **Password**: `sparkapply_dev_password`
- **Database**: `sparkapply_dev`

### **Service Ports**
- **User Service**: `3001`
- **Job Service**: `3002`
- **PostgreSQL**: `5432`
- **Redis**: `6379`

## 🔧 Environment Files

Both services need `.env` files with these key settings:

### **User Service (.env)**
```env
PORT=3001
DATABASE_URL=postgresql://sparkapply:sparkapply_dev_password@localhost:5432/sparkapply_dev
POSTGRES_HOST=localhost
POSTGRES_DB=sparkapply_dev
POSTGRES_USER=sparkapply
POSTGRES_PASSWORD=sparkapply_dev_password
JWT_SECRET=dev-jwt-secret-key
```

### **Job Service (.env)**
```env
PORT=3002
DATABASE_URL=postgresql://sparkapply:sparkapply_dev_password@localhost:5432/sparkapply_dev
POSTGRES_HOST=localhost
POSTGRES_DB=sparkapply_dev
POSTGRES_USER=sparkapply
POSTGRES_PASSWORD=sparkapply_dev_password
JWT_SECRET=dev-jwt-secret-key
USER_SERVICE_URL=http://localhost:3001
```

## ✅ Testing Database Connection

### **Quick Test Command**
```bash
# Test from any service directory
node -e "
require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
sequelize.authenticate()
  .then(() => console.log('✅ Database connection successful!'))
  .catch(e => console.error('❌ Connection failed:', e.message));
"
```

### **Expected Output**
```
✅ Database connection successful!
```

## 🚨 Troubleshooting

### **Error: "password authentication failed"**
```bash
# Reset password
sudo -u postgres psql -c "ALTER USER sparkapply WITH PASSWORD 'sparkapply_dev_password';"
```

### **Error: "database does not exist"**
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE sparkapply_dev OWNER sparkapply;"
```

### **Error: "connection refused"**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Or start Docker containers
docker-compose -f docker-compose.dev.yml up -d postgres
```

### **Error: "Cannot find module 'dotenv'"**
```bash
# Install dependencies
npm install
```

### **Error: "role does not exist"**
```bash
# Create user
sudo -u postgres psql -c "CREATE USER sparkapply WITH PASSWORD 'sparkapply_dev_password';"
```

## 🐳 Docker Commands

### **Start Services**
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Start only database services
docker-compose -f docker-compose.dev.yml up -d postgres redis

# View logs
docker-compose -f docker-compose.dev.yml logs postgres
```

### **Stop Services**
```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.dev.yml down -v
```

## 📊 Database Schema

The database includes these main tables:
- `users` - User accounts and authentication
- `job_seeker_profiles` - Job seeker profile data
- `jobs` - Job postings
- `applications` - Job applications
- `companies` - Company information

## 🔄 Database Migrations

```bash
# Run migrations (when available)
npm run db:migrate

# Seed sample data
npm run db:seed

# Reset database
npm run db:reset
```

## 🎯 Next Steps

Once your database is set up:

1. ✅ **Start Services**
   ```bash
   # Terminal 1: User Service
   cd packages/api/user-service && npm run dev
   
   # Terminal 2: Job Service  
   cd packages/api/job-service && npm run dev
   ```

2. ✅ **Test Endpoints**
   - User Service: http://localhost:3001/health
   - Job Service: http://localhost:3002/health

3. ✅ **Continue with Phase 1**
   - Implement authentication
   - Set up service communication
   - Build job matching features

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run the automated setup script: `./scripts/setup-database.sh`
3. Verify your `.env` files match the examples
4. Ensure PostgreSQL is running and accessible

**Database setup is now complete! Ready to build SparkApply! 🚀**
