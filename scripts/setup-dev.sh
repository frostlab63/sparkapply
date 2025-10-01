#!/bin/bash

# SparkApply - Development Environment Setup
# This script sets up the development environment for SparkApply

set -e

echo "🚀 Setting up SparkApply Development Environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    print_error "Please run this script from the SparkApply root directory"
    exit 1
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first:"
    echo "  npm install -g pnpm"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
print_status "pnpm version: $PNPM_VERSION"

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Setup environment files
print_status "Setting up environment files..."

# Backend environment
BACKEND_ENV_FILE="packages/api/user-service/.env"
if [ ! -f "$BACKEND_ENV_FILE" ]; then
    print_status "Creating backend .env file..."
    cp "packages/api/user-service/.env.example" "$BACKEND_ENV_FILE"
    print_warning "Please update $BACKEND_ENV_FILE with your actual configuration"
else
    print_status "Backend .env file already exists"
fi

# Install Playwright browsers for E2E testing
print_status "Installing Playwright browsers..."
cd packages/web
if pnpm exec playwright install; then
    print_success "Playwright browsers installed"
else
    print_warning "Playwright browser installation failed - E2E tests may not work"
fi
cd ../..

# Run initial tests to verify setup
print_status "Running initial tests to verify setup..."
if pnpm run test:frontend -- --run; then
    print_success "Frontend tests passed"
else
    print_warning "Some frontend tests failed - this might be expected during development"
fi

# Check if PostgreSQL is available
print_status "Checking database connectivity..."
if command -v psql &> /dev/null; then
    print_status "PostgreSQL client found"
    print_warning "Make sure PostgreSQL server is running and configured"
else
    print_warning "PostgreSQL client not found - you'll need to install PostgreSQL for backend development"
fi

# Create useful aliases
print_status "Development commands available:"
echo ""
echo "  📦 Package Management:"
echo "    pnpm install              - Install all dependencies"
echo "    pnpm run clean            - Clean all node_modules"
echo ""
echo "  🚀 Development:"
echo "    pnpm run dev              - Start all services in development mode"
echo "    pnpm run dev:frontend     - Start only frontend"
echo "    pnpm run dev:backend      - Start only backend"
echo ""
echo "  🧪 Testing:"
echo "    pnpm run test             - Run all tests"
echo "    pnpm run test:frontend    - Run frontend tests"
echo "    pnpm run test:backend     - Run backend tests"
echo "    pnpm run test:e2e         - Run E2E tests"
echo "    ./scripts/test-all.sh     - Run comprehensive test suite"
echo ""
echo "  🔧 Code Quality:"
echo "    pnpm run lint             - Run linting"
echo "    pnpm run lint:fix         - Fix linting issues"
echo "    pnpm run format           - Format code"
echo "    pnpm run format:check     - Check code formatting"
echo ""
echo "  🏗️ Build:"
echo "    pnpm run build            - Build all packages"
echo "    pnpm run build:frontend   - Build frontend only"
echo "    pnpm run build:backend    - Build backend only"
echo ""

print_success "🎉 Development environment setup completed!"
echo ""
print_status "Next steps:"
echo "  1. Update environment files with your configuration"
echo "  2. Start PostgreSQL database"
echo "  3. Run 'pnpm run dev' to start development servers"
echo "  4. Open http://localhost:5173 for frontend"
echo "  5. Backend API will be available at http://localhost:3001"
echo ""
print_warning "Don't forget to check the README.md for detailed setup instructions!"
echo ""
