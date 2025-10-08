# SparkApply Quick Start Guide

This guide will get SparkApply running on your local machine in under 10 minutes.

## Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **PostgreSQL** (version 14 or higher)
- **Git** (for cloning the repository)

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/frostlab63/sparkapply.git
cd sparkapply

# Install root dependencies
npm install
```

## Step 2: Database Setup

### Option A: Local PostgreSQL
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE sparkapply_dev;
CREATE USER sparkapply WITH PASSWORD 'sparkapply123';
GRANT ALL PRIVILEGES ON DATABASE sparkapply_dev TO sparkapply;
\q
```

### Option B: Docker PostgreSQL (if you have Docker)
```bash
docker run --name sparkapply-postgres \
  -e POSTGRES_DB=sparkapply_dev \
  -e POSTGRES_USER=sparkapply \
  -e POSTGRES_PASSWORD=sparkapply123 \
  -p 5432:5432 \
  -d postgres:14
```

## Step 3: Configure Services

### User Service
```bash
cd packages/api/user-service
cp .env.example .env
# The default .env should work for local development
npm install
```

### Job Service
```bash
cd ../job-service
cp .env.example .env
# Update database configuration if needed
npm install
```

### Frontend
```bash
cd ../../web
npm install
```

## Step 4: Start Services

Open **three separate terminal windows** and run:

### Terminal 1: User Service
```bash
cd packages/api/user-service
npm run dev
# Should start on http://localhost:3001
```

### Terminal 2: Job Service
```bash
cd packages/api/job-service
npm run dev
# Should start on http://localhost:3002
```

### Terminal 3: Frontend
```bash
cd packages/web
npm run dev
# Should start on http://localhost:5173
```

## Step 5: Seed Sample Data

In a fourth terminal:
```bash
cd packages/api/job-service
node scripts/seed-jobs.js
```

## Step 6: Test the Application

1. **Open your browser** to http://localhost:5173
2. **Create an account** using the registration form
3. **Test job search** by visiting http://localhost:3002/api/jobs/search

## Verification Checklist

Verify these endpoints are working:

- ✅ Frontend: http://localhost:5173
- ✅ User Service Health: http://localhost:3001/api/v1/health
- ✅ Job Service Health: http://localhost:3002/health
- ✅ Job Search API: http://localhost:3002/api/jobs/search

## Common Issues and Solutions

### Database Connection Error
If you see database connection errors:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l | grep sparkapply
```

### Port Already in Use
If ports 3001, 3002, or 5173 are in use:
```bash
# Find and kill processes using the ports
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:3002 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9
```

### Node Modules Issues
If you encounter dependency issues:
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

Once you have the application running:

1. **Explore the API** using the job search endpoints
2. **Test user registration** and authentication
3. **Review the code structure** to understand the architecture
4. **Check the deployment guide** (`DEPLOYMENT_GUIDE.md`) for production setup

## Production Deployment

For production deployment, see:
- `DEPLOYMENT_GUIDE.md` - Comprehensive production deployment guide
- `docker-compose.prod.yml` - Production Docker configuration
- `.env.production.template` - Production environment template

## Support

If you encounter issues:
1. Check the logs in each terminal window
2. Verify all prerequisites are installed
3. Ensure database is running and accessible
4. Review the `FINAL_PROJECT_STATUS.md` for known limitations

The SparkApply platform is now ready for development and testing!
