import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Lightweight production test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },  // Ramp up to 5 users
    { duration: '1m', target: 5 },   // Stay at 5 users
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],             // Custom error rate must be below 5%
  },
};

// Production URLs
const BASE_URL = 'https://api.sparkapply.com';
const WEB_URL = 'https://sparkapply.com';

export function setup() {
  console.log('Starting production performance validation...');
  return {};
}

export default function() {
  // Test 1: Critical Health Checks
  testCriticalEndpoints();
  
  // Test 2: Public API Endpoints
  testPublicEndpoints();
  
  // Test 3: Frontend Performance
  testFrontendLoad();
  
  sleep(2); // Longer sleep for production to be gentle
}

function testCriticalEndpoints() {
  const endpoints = [
    `${BASE_URL}/api/v1/health`,
    `${WEB_URL}`,
  ];
  
  endpoints.forEach(url => {
    const response = http.get(url, {
      timeout: '15s',
      tags: { test_type: 'critical_health' }
    });
    
    const success = check(response, {
      [`${url} status is 200`]: (r) => r.status === 200,
      [`${url} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!success);
    
    if (!success) {
      console.error(`Critical endpoint failed: ${url}, Status: ${response.status}`);
    }
  });
}

function testPublicEndpoints() {
  // Test public job listings (without auth)
  const jobsResponse = http.get(`${BASE_URL}/api/jobs?limit=10`, {
    timeout: '10s',
    tags: { test_type: 'public_jobs' }
  });
  
  const jobsSuccess = check(jobsResponse, {
    'public jobs status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'public jobs response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!jobsSuccess);
  
  // Test registration endpoint (without actually registering)
  const registerResponse = http.post(`${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      email: 'test@example.com', // This should fail validation
      password: 'short'
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
      tags: { test_type: 'registration_validation' }
    }
  );
  
  const registerSuccess = check(registerResponse, {
    'registration validation responds': (r) => r.status >= 400 && r.status < 500,
    'registration validation response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!registerSuccess);
}

function testFrontendLoad() {
  const frontendResponse = http.get(WEB_URL, {
    timeout: '15s',
    tags: { test_type: 'frontend_production' }
  });
  
  const frontendSuccess = check(frontendResponse, {
    'frontend status is 200': (r) => r.status === 200,
    'frontend response time < 3000ms': (r) => r.timings.duration < 3000,
    'frontend has basic content': (r) => {
      const body = r.body.toLowerCase();
      return body.includes('sparkapply') || 
             body.includes('job') || 
             body.includes('react') ||
             body.includes('application');
    },
  });
  
  errorRate.add(!frontendSuccess);
  
  if (!frontendSuccess) {
    console.error(`Frontend test failed. Status: ${frontendResponse.status}`);
  }
}

export function teardown(data) {
  console.log('Production performance validation completed');
}
