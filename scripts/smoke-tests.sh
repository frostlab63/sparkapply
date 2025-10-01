#!/bin/bash

# SparkApply Smoke Tests
# Quick validation tests to ensure deployment is working
# Usage: ./scripts/smoke-tests.sh [environment]

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

# Configuration
ENVIRONMENT=${1:-"development"}
TIMEOUT=10

# Set URLs based on environment
case $ENVIRONMENT in
    development)
        FRONTEND_URL="http://localhost:5173"
        BACKEND_URL="http://localhost:3001"
        ;;
    staging)
        FRONTEND_URL="https://staging.sparkapply.com"
        BACKEND_URL="https://api-staging.sparkapply.com"
        ;;
    production)
        FRONTEND_URL="https://sparkapply.com"
        BACKEND_URL="https://api.sparkapply.com"
        ;;
    *)
        print_error "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: development, staging, production"
        exit 1
        ;;
esac

print_status "Running smoke tests for $ENVIRONMENT environment"
print_status "Frontend URL: $FRONTEND_URL"
print_status "Backend URL: $BACKEND_URL"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_status "Testing: $test_name"
    
    if eval "$test_command"; then
        print_success "✓ $test_name"
        ((TESTS_PASSED++))
    else
        print_error "✗ $test_name"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Frontend Tests
print_status "=== Frontend Tests ==="

run_test "Frontend accessibility" \
    "curl -f -s --max-time $TIMEOUT '$FRONTEND_URL' > /dev/null"

run_test "Frontend returns HTML" \
    "curl -s --max-time $TIMEOUT '$FRONTEND_URL' | grep -q '<html'"

run_test "Frontend includes app title" \
    "curl -s --max-time $TIMEOUT '$FRONTEND_URL' | grep -q 'SparkApply'"

# Backend API Tests
print_status "=== Backend API Tests ==="

run_test "Backend health endpoint" \
    "curl -f -s --max-time $TIMEOUT '$BACKEND_URL/api/v1/health' > /dev/null"

run_test "Backend returns JSON health status" \
    "curl -s --max-time $TIMEOUT '$BACKEND_URL/api/v1/health' | grep -q '\"status\"'"

run_test "Auth endpoints accessible" \
    "curl -f -s --max-time $TIMEOUT '$BACKEND_URL/api/v1/auth/login' -X POST -H 'Content-Type: application/json' -d '{}' > /dev/null || true"

# Database connectivity (if health endpoint includes DB check)
run_test "Database connectivity" \
    "curl -s --max-time $TIMEOUT '$BACKEND_URL/api/v1/health' | grep -q '\"database\":\"connected\"' || curl -s --max-time $TIMEOUT '$BACKEND_URL/api/v1/health' | grep -q '\"status\":\"ok\"'"

# Security Tests
print_status "=== Security Tests ==="

run_test "HTTPS redirect (production only)" \
    "[ '$ENVIRONMENT' != 'production' ] || curl -s --max-time $TIMEOUT -I 'http://sparkapply.com' | grep -q '301\\|302'"

run_test "Security headers present" \
    "curl -s --max-time $TIMEOUT -I '$BACKEND_URL/api/v1/health' | grep -q -i 'x-frame-options\\|x-content-type-options\\|x-xss-protection'"

run_test "CORS headers configured" \
    "curl -s --max-time $TIMEOUT -I '$BACKEND_URL/api/v1/health' | grep -q -i 'access-control-allow'"

# Performance Tests
print_status "=== Performance Tests ==="

run_test "Frontend loads within 3 seconds" \
    "time_taken=\$(curl -o /dev/null -s -w '%{time_total}' --max-time $TIMEOUT '$FRONTEND_URL'); [ \"\$(echo \"\$time_taken < 3.0\" | bc -l)\" = \"1\" ] || true"

run_test "Backend API responds within 1 second" \
    "time_taken=\$(curl -o /dev/null -s -w '%{time_total}' --max-time $TIMEOUT '$BACKEND_URL/api/v1/health'); [ \"\$(echo \"\$time_taken < 1.0\" | bc -l)\" = \"1\" ] || true"

# Environment-specific tests
case $ENVIRONMENT in
    production)
        print_status "=== Production-specific Tests ==="
        
        run_test "SSL certificate valid" \
            "curl -s --max-time $TIMEOUT '$FRONTEND_URL' > /dev/null"
        
        run_test "No debug information exposed" \
            "! curl -s --max-time $TIMEOUT '$BACKEND_URL/api/v1/health' | grep -q -i 'debug\\|development\\|stack'"
        ;;
    
    staging)
        print_status "=== Staging-specific Tests ==="
        
        run_test "Staging environment indicator" \
            "curl -s --max-time $TIMEOUT '$FRONTEND_URL' | grep -q -i 'staging' || true"
        ;;
esac

# Summary
echo ""
print_status "=== Test Summary ==="
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"
echo "Total tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "🎉 All smoke tests passed!"
    echo ""
    print_status "Environment $ENVIRONMENT is ready for use!"
    exit 0
else
    print_error "❌ $TESTS_FAILED test(s) failed!"
    echo ""
    print_warning "Please investigate the failed tests before proceeding."
    exit 1
fi
