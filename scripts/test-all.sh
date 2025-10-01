#!/bin/bash

# SparkApply - Comprehensive Test Suite
# This script runs all tests in the correct order with proper setup

set -e

echo "🚀 Starting SparkApply Test Suite..."
echo "=================================="

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

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
fi

# Lint check
print_status "Running linting checks..."
if pnpm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found - continuing with tests"
fi

# Format check
print_status "Checking code formatting..."
if pnpm run format:check; then
    print_success "Code formatting is correct"
else
    print_warning "Code formatting issues found - continuing with tests"
fi

# Frontend unit tests
print_status "Running frontend unit tests..."
if pnpm run test:frontend -- --run; then
    print_success "Frontend unit tests passed"
else
    print_error "Frontend unit tests failed"
    exit 1
fi

# Backend unit tests
print_status "Running backend unit tests..."
if pnpm run test:backend; then
    print_success "Backend unit tests passed"
else
    print_error "Backend unit tests failed"
    exit 1
fi

# Build tests
print_status "Testing build process..."
if pnpm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# E2E tests (optional - requires services to be running)
if command -v playwright &> /dev/null; then
    print_status "Playwright detected - running E2E tests..."
    if pnpm run test:e2e; then
        print_success "E2E tests passed"
    else
        print_warning "E2E tests failed - this might be expected if services aren't running"
    fi
else
    print_warning "Playwright not found - skipping E2E tests"
fi

# Generate coverage report
print_status "Generating test coverage report..."
if pnpm run test:coverage; then
    print_success "Coverage report generated"
else
    print_warning "Coverage report generation failed"
fi

echo ""
echo "=================================="
print_success "🎉 Test suite completed successfully!"
echo ""
print_status "Next steps:"
echo "  - Review test coverage in coverage/ directory"
echo "  - Check lint warnings and fix if needed"
echo "  - Run 'pnpm run format' to fix formatting issues"
echo "  - Commit your changes and push to trigger CI/CD"
echo ""
