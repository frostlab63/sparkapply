# SparkApply Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying SparkApply to production. The platform consists of multiple microservices that work together to provide AI-powered job matching functionality.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  User Service   │    │  Job Service    │
│   (React/Vite)  │    │  (Node.js)      │    │  (Node.js)      │
│   Port: 5173    │    │  Port: 3001     │    │  Port: 3002     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   Port: 5432    │
                    └─────────────────┘
```

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher)
- **Docker** (optional, for containerized deployment)
- **Git** (for repository management)

### Required Accounts
- **Cloud Provider** (AWS, GCP, or Azure)
- **Domain Name** (for production URL)
- **SSL Certificate** (Let's Encrypt recommended)

## Local Development Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/frostlab63/sparkapply.git
cd sparkapply

# Install root dependencies
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE sparkapply_prod;
CREATE USER sparkapply WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sparkapply_prod TO sparkapply;
\q
```

#### Option B: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name sparkapply-postgres \
  -e POSTGRES_DB=sparkapply_prod \
  -e POSTGRES_USER=sparkapply \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:14
```

### 3. Redis Setup

```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Or using Docker
docker run --name sparkapply-redis -p 6379:6379 -d redis:6
```

### 4. Environment Configuration

#### User Service Environment
Create `packages/api/user-service/.env`:

```env
# Server Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://sparkapply:your_secure_password@localhost:5432/sparkapply_prod
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=sparkapply_prod
POSTGRES_USER=sparkapply
POSTGRES_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@sparkapply.com

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Job Service Environment
Create `packages/api/job-service/.env`:

```env
# Server Configuration
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

# Database Configuration (same as user service)
DATABASE_URL=postgresql://sparkapply:your_secure_password@localhost:5432/sparkapply_prod
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=sparkapply_prod
POSTGRES_USER=sparkapply
POSTGRES_PASSWORD=your_secure_password

# JWT Configuration (must match user service)
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=1

# Service URLs
USER_SERVICE_URL=http://localhost:3001

# External API Keys (optional)
LINKEDIN_API_KEY=your_linkedin_api_key
INDEED_API_KEY=your_indeed_api_key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com
```

#### Frontend Environment
Create `packages/web/.env`:

```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_USER_SERVICE_URL=https://api.your-domain.com/api/v1
VITE_JOB_SERVICE_URL=https://api.your-domain.com/api/jobs
```

### 5. Service Deployment

#### Install Dependencies
```bash
# User Service
cd packages/api/user-service
npm install --production
npm run build  # if build script exists

# Job Service
cd ../job-service
npm install --production
npm run build  # if build script exists

# Frontend
cd ../../web
npm install --production
npm run build
```

#### Database Migration
```bash
# Run database migrations
cd packages/api/user-service
npm run db:migrate  # if migration script exists

# Seed initial data
cd ../job-service
node scripts/seed-jobs.js
```

## Production Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx
```

#### 2. Application Deployment
```bash
# Create application directory
sudo mkdir -p /var/www/sparkapply
sudo chown $USER:$USER /var/www/sparkapply

# Copy application files
cp -r sparkapply/* /var/www/sparkapply/
cd /var/www/sparkapply

# Install dependencies
npm install --production
```

#### 3. PM2 Configuration
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'sparkapply-user-service',
      script: 'packages/api/user-service/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'sparkapply-job-service',
      script: 'packages/api/job-service/src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
};
```

Start services:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Nginx Configuration
Create `/etc/nginx/sites-available/sparkapply`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend
    location / {
        root /var/www/sparkapply/packages/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Gateway
    location /api/v1/ {
        proxy_pass http://localhost:3001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/jobs/ {
        proxy_pass http://localhost:3002/api/jobs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sparkapply /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### 1. Create Dockerfiles

**User Service Dockerfile** (`packages/api/user-service/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
```

**Job Service Dockerfile** (`packages/api/job-service/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["node", "src/index.js"]
```

**Frontend Dockerfile** (`packages/web/Dockerfile`):
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

#### 2. Docker Compose Configuration
Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: sparkapply_prod
      POSTGRES_USER: sparkapply
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  user-service:
    build:
      context: ./packages/api/user-service
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://sparkapply:${POSTGRES_PASSWORD}@postgres:5432/sparkapply_prod
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  job-service:
    build:
      context: ./packages/api/job-service
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://sparkapply:${POSTGRES_PASSWORD}@postgres:5432/sparkapply_prod
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./packages/web
    ports:
      - "80:80"
    depends_on:
      - user-service
      - job-service
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy with Docker Compose:
```bash
# Create environment file
echo "POSTGRES_PASSWORD=your_secure_password" > .env
echo "JWT_SECRET=your_super_secure_jwt_secret" >> .env
echo "JWT_REFRESH_SECRET=your_super_secure_refresh_secret" >> .env

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

**Namespace** (`k8s/namespace.yaml`):
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sparkapply
```

**ConfigMap** (`k8s/configmap.yaml`):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sparkapply-config
  namespace: sparkapply
data:
  NODE_ENV: "production"
  POSTGRES_HOST: "postgres-service"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "sparkapply_prod"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
```

**Secrets** (`k8s/secrets.yaml`):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sparkapply-secrets
  namespace: sparkapply
type: Opaque
data:
  postgres-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
  jwt-refresh-secret: <base64-encoded-refresh-secret>
```

**PostgreSQL Deployment** (`k8s/postgres.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: sparkapply
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: sparkapply-config
              key: POSTGRES_DB
        - name: POSTGRES_USER
          value: sparkapply
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: sparkapply-secrets
              key: postgres-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: sparkapply
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

Deploy to Kubernetes:
```bash
kubectl apply -f k8s/
```

## Security Considerations

### 1. Environment Variables
- Use strong, unique passwords for all services
- Generate secure JWT secrets (minimum 32 characters)
- Store sensitive data in environment variables, never in code

### 2. Database Security
- Enable SSL/TLS for database connections
- Use connection pooling with appropriate limits
- Regular database backups
- Implement database access logging

### 3. API Security
- Enable CORS with specific origins
- Implement rate limiting
- Use HTTPS for all communications
- Validate and sanitize all inputs
- Implement proper authentication and authorization

### 4. Infrastructure Security
- Keep all software updated
- Use firewalls to restrict access
- Implement monitoring and alerting
- Regular security audits

## Monitoring and Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit
```

### 2. Log Management
- Configure centralized logging (ELK stack or similar)
- Set up log rotation
- Monitor error rates and response times

### 3. Health Checks
Each service provides health check endpoints:
- User Service: `GET /api/v1/health`
- Job Service: `GET /health`

## Backup and Recovery

### 1. Database Backups
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/var/backups/sparkapply"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U sparkapply sparkapply_prod > $BACKUP_DIR/sparkapply_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "sparkapply_*.sql" -mtime +7 -delete
```

### 2. Application Backups
- Regular code repository backups
- Configuration file backups
- SSL certificate backups

## Scaling Considerations

### 1. Horizontal Scaling
- Use load balancers for multiple instances
- Implement session management with Redis
- Database read replicas for read-heavy workloads

### 2. Performance Optimization
- Enable caching (Redis)
- Optimize database queries
- Use CDN for static assets
- Implement API response caching

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **Service Not Starting**
   - Check environment variables
   - Verify port availability
   - Check application logs

3. **Frontend Not Loading**
   - Verify API endpoints are accessible
   - Check CORS configuration
   - Verify build process completed successfully

### Log Locations
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- Application logs: Check service-specific log configurations

## Support and Maintenance

### Regular Maintenance Tasks
- Update dependencies monthly
- Monitor security advisories
- Review and rotate secrets quarterly
- Performance monitoring and optimization
- Database maintenance and optimization

### Getting Help
- Check application logs first
- Review this deployment guide
- Consult service-specific documentation
- Contact development team for critical issues

---

**Note**: This guide provides a comprehensive foundation for production deployment. Specific requirements may vary based on your infrastructure, security policies, and scaling needs. Always test deployments in a staging environment before production.
