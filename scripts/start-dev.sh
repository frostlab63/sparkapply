#!/bin/bash

# SparkApply Development Environment Startup Script
# This script starts all services in the correct order without Docker

set -e

echo "🚀 Starting SparkApply Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to kill processes on specific ports
cleanup_port() {
    local port=$1
    if check_port $port; then
        echo -e "${YELLOW}🧹 Cleaning up port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    cleanup_port 3001
    cleanup_port 3002
    cleanup_port 3005
    cleanup_port 5173
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Step 1: Check and start PostgreSQL and Redis
echo -e "${BLUE}📊 Checking database services...${NC}"

if ! systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}🔄 Starting PostgreSQL...${NC}"
    sudo systemctl start postgresql
fi

if ! systemctl is-active --quiet redis-server; then
    echo -e "${YELLOW}🔄 Starting Redis...${NC}"
    sudo systemctl start redis-server
fi

# Step 2: Initialize database
echo -e "${BLUE}🗄️ Initializing database...${NC}"
sudo -u postgres psql -c "ALTER USER sparkapply WITH PASSWORD 'password123';" 2>/dev/null || true

# Step 3: Clean up any existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
cleanup_port 3001
cleanup_port 3002
cleanup_port 3005
cleanup_port 5173

# Step 4: Create .env files from examples
echo -e "${BLUE}⚙️ Setting up environment files...${NC}"

for service in user-service job-service application-service; do
    if [ ! -f "packages/api/$service/.env" ]; then
        cp "packages/api/$service/.env.example" "packages/api/$service/.env"
        echo -e "${GREEN}✅ Created .env for $service${NC}"
    fi
done

if [ ! -f "packages/web/.env" ]; then
    cp "packages/web/.env.example" "packages/web/.env"
    echo -e "${GREEN}✅ Created .env for frontend${NC}"
fi

# Step 5: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"

for service in user-service job-service application-service; do
    echo -e "${YELLOW}📦 Installing dependencies for $service...${NC}"
    cd "packages/api/$service"
    npm install --legacy-peer-deps >/dev/null 2>&1 || npm install >/dev/null 2>&1
    cd - >/dev/null
done

echo -e "${YELLOW}📦 Installing dependencies for frontend...${NC}"
cd packages/web
npm install --legacy-peer-deps >/dev/null 2>&1 || npm install >/dev/null 2>&1
cd - >/dev/null

# Step 6: Start backend services
echo -e "${BLUE}🚀 Starting backend services...${NC}"

# Start User Service
echo -e "${YELLOW}🔐 Starting User Service...${NC}"
cd packages/api/user-service
npm run dev > ../../../logs/user-service.log 2>&1 &
USER_SERVICE_PID=$!
cd - >/dev/null

# Start Job Service
echo -e "${YELLOW}💼 Starting Job Service...${NC}"
cd packages/api/job-service
npm run dev > ../../../logs/job-service.log 2>&1 &
JOB_SERVICE_PID=$!
cd - >/dev/null

# Start Application Service
echo -e "${YELLOW}📋 Starting Application Service...${NC}"
cd packages/api/application-service
npm run dev > ../../../logs/application-service.log 2>&1 &
APPLICATION_SERVICE_PID=$!
cd - >/dev/null

# Step 7: Wait for backend services to be ready
mkdir -p logs

wait_for_service "http://localhost:3001/api/v1/health" "User Service"
wait_for_service "http://localhost:3002/health" "Job Service"
wait_for_service "http://localhost:3005/health" "Application Service"

# Step 8: Start frontend
echo -e "${YELLOW}🎨 Starting Frontend...${NC}"
cd packages/web
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd - >/dev/null

# Step 9: Wait for frontend to be ready
wait_for_service "http://localhost:5173" "Frontend"

# Step 10: Display status
echo -e "\n${GREEN}🎉 SparkApply Development Environment is ready!${NC}"
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "  🔐 User Service:        http://localhost:3001"
echo -e "  💼 Job Service:         http://localhost:3002"
echo -e "  📋 Application Service: http://localhost:3005"
echo -e "  🎨 Frontend:            http://localhost:5173"
echo -e "\n${BLUE}📝 Logs are available in the logs/ directory${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Keep the script running
wait
