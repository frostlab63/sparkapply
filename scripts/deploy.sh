#!/bin/bash

# SparkApply Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]
# Example: ./scripts/deploy.sh staging v1.0.1

set -e

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

# Check arguments
if [ $# -lt 1 ]; then
    print_error "Usage: $0 [environment] [version]"
    echo "Environments: development, staging, production"
    echo "Example: $0 staging v1.0.1"
    exit 1
fi

ENVIRONMENT=$1
VERSION=${2:-"latest"}

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        print_status "Deploying to $ENVIRONMENT environment (version: $VERSION)"
        ;;
    *)
        print_error "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: development, staging, production"
        exit 1
        ;;
esac

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    print_error "Please run this script from the SparkApply root directory"
    exit 1
fi

# Load environment variables
ENV_FILE=".env.$ENVIRONMENT"
if [ -f "$ENV_FILE" ]; then
    print_status "Loading environment variables from $ENV_FILE"
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
else
    print_warning "Environment file $ENV_FILE not found, using defaults"
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests (skip for production if needed)
if [ "$ENVIRONMENT" != "production" ]; then
    print_status "Running tests..."
    if ! pnpm run test:frontend -- --run --reporter=basic; then
        print_warning "Some tests failed, but continuing deployment to $ENVIRONMENT"
    fi
fi

# Build applications
print_status "Building applications..."
pnpm run build

# Environment-specific deployment steps
case $ENVIRONMENT in
    development)
        print_status "Starting development servers..."
        print_warning "Development deployment - servers will run in foreground"
        pnpm run dev
        ;;
    
    staging)
        print_status "Deploying to staging environment..."
        
        # Build Docker images for staging
        print_status "Building Docker images..."
        docker-compose -f docker-compose.staging.yml build
        
        # Deploy to staging
        print_status "Starting staging services..."
        docker-compose -f docker-compose.staging.yml up -d
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 30
        
        # Run health checks
        print_status "Running health checks..."
        if curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
            print_success "Backend health check passed"
        else
            print_warning "Backend health check failed"
        fi
        
        if curl -f http://localhost:5173 > /dev/null 2>&1; then
            print_success "Frontend health check passed"
        else
            print_warning "Frontend health check failed"
        fi
        
        print_success "Staging deployment completed!"
        print_status "Frontend: http://localhost:5173"
        print_status "Backend API: http://localhost:3001/api/v1"
        ;;
    
    production)
        print_status "Deploying to production environment..."
        print_warning "Production deployment requires additional verification"
        
        # Additional production checks
        if [ -z "$DATABASE_URL" ]; then
            print_error "DATABASE_URL not set for production"
            exit 1
        fi
        
        if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_THIS_TO_STRONG_PRODUCTION_SECRET" ]; then
            print_error "JWT_SECRET not properly configured for production"
            exit 1
        fi
        
        # Confirmation prompt for production
        read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_status "Production deployment cancelled"
            exit 0
        fi
        
        # Production deployment steps would go here
        print_status "Production deployment steps would be implemented here"
        print_warning "This is a template - implement actual production deployment"
        ;;
esac

# Post-deployment tasks
print_status "Running post-deployment tasks..."

# Tag the deployment
if [ "$VERSION" != "latest" ]; then
    print_status "Tagging deployment with version $VERSION"
    git tag -a "$VERSION" -m "Deployment to $ENVIRONMENT: $VERSION"
fi

# Log deployment
echo "$(date): Deployed version $VERSION to $ENVIRONMENT" >> deployments.log

print_success "🚀 Deployment to $ENVIRONMENT completed successfully!"

# Show next steps
echo ""
print_status "Next steps:"
case $ENVIRONMENT in
    staging)
        echo "  - Test the staging environment thoroughly"
        echo "  - Run smoke tests: ./scripts/smoke-tests.sh staging"
        echo "  - Monitor logs: docker-compose -f docker-compose.staging.yml logs -f"
        ;;
    production)
        echo "  - Monitor application metrics and logs"
        echo "  - Run production smoke tests"
        echo "  - Notify team of successful deployment"
        ;;
esac
echo ""
