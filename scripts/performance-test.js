import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

// Base URL - will be different for staging vs production
const BASE_URL = __ENV.BASE_URL || 'https://staging-api.sparkapply.com';
const WEB_URL = __ENV.WEB_URL || 'https://staging.sparkapply.com';

// Test data
const testUser = {
  email: `test-${Math.random().toString(36).substring(7)}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Performance',
  lastName: 'Test'
};

export function setup() {
  console.log(`Starting performance tests against ${BASE_URL}`);
  return { testUser };
}

export default function(data) {
  // Test 1: Health Check
  testHealthEndpoints();
  
  // Test 2: User Registration and Authentication
  const authToken = testUserAuthentication(data.testUser);
  
  // Test 3: Job Listings
  testJobListings(authToken);
  
  // Test 4: Job Application Flow
  if (authToken) {
    testJobApplicationFlow(authToken);
  }
  
  // Test 5: Frontend Performance
  testFrontendPerformance();
  
  sleep(1);
}

function testHealthEndpoints() {
  const services = [
    `${BASE_URL}/api/v1/health`,
    `${BASE_URL.replace('api.', '')}:3002/health`,
    `${BASE_URL.replace('api.', '')}:3005/health`
  ];
  
  services.forEach(url => {
    const response = http.get(url, {
      timeout: '10s',
      tags: { test_type: 'health_check' }
    });
    
    const success = check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
  });
}

function testUserAuthentication(user) {
  // Register user
  const registerResponse = http.post(`${BASE_URL}/api/v1/auth/register`, 
    JSON.stringify(user), 
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { test_type: 'user_registration' }
    }
  );
  
  const registerSuccess = check(registerResponse, {
    'registration status is 201 or 409': (r) => r.status === 201 || r.status === 409,
    'registration response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!registerSuccess);
  
  // Login user
  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { test_type: 'user_login' }
    }
  );
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined;
      } catch (e) {
        return false;
      }
    }
  });
  
  errorRate.add(!loginSuccess);
  
  if (loginSuccess && loginResponse.status === 200) {
    try {
      const loginBody = JSON.parse(loginResponse.body);
      return loginBody.token;
    } catch (e) {
      console.error('Failed to parse login response:', e);
      return null;
    }
  }
  
  return null;
}

function testJobListings(authToken) {
  const headers = authToken ? 
    { 'Authorization': `Bearer ${authToken}` } : 
    {};
  
  // Test job listings endpoint
  const jobsResponse = http.get(`${BASE_URL.replace('api.', '')}:3002/api/jobs`, {
    headers,
    tags: { test_type: 'job_listings' }
  });
  
  const jobsSuccess = check(jobsResponse, {
    'jobs listing status is 200': (r) => r.status === 200,
    'jobs listing response time < 300ms': (r) => r.timings.duration < 300,
    'jobs listing returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    }
  });
  
  errorRate.add(!jobsSuccess);
  
  // Test job search
  const searchResponse = http.get(`${BASE_URL.replace('api.', '')}:3002/api/jobs?search=developer`, {
    headers,
    tags: { test_type: 'job_search' }
  });
  
  const searchSuccess = check(searchResponse, {
    'job search status is 200': (r) => r.status === 200,
    'job search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!searchSuccess);
}

function testJobApplicationFlow(authToken) {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  // Get available jobs first
  const jobsResponse = http.get(`${BASE_URL.replace('api.', '')}:3002/api/jobs?limit=1`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    tags: { test_type: 'get_jobs_for_application' }
  });
  
  if (jobsResponse.status === 200) {
    try {
      const jobsBody = JSON.parse(jobsResponse.body);
      if (jobsBody.data && jobsBody.data.length > 0) {
        const jobId = jobsBody.data[0].id;
        
        // Create job application
        const applicationData = {
          jobId: jobId,
          coverLetter: 'This is a test cover letter for performance testing.',
          resumeUrl: 'https://example.com/test-resume.pdf'
        };
        
        const applicationResponse = http.post(
          `${BASE_URL.replace('api.', '')}:3005/api/applications`,
          JSON.stringify(applicationData),
          {
            headers,
            tags: { test_type: 'job_application' }
          }
        );
        
        const applicationSuccess = check(applicationResponse, {
          'application creation status is 201': (r) => r.status === 201,
          'application creation response time < 1000ms': (r) => r.timings.duration < 1000,
        });
        
        errorRate.add(!applicationSuccess);
      }
    } catch (e) {
      console.error('Failed to parse jobs response for application test:', e);
    }
  }
}

function testFrontendPerformance() {
  const frontendResponse = http.get(WEB_URL, {
    tags: { test_type: 'frontend_load' }
  });
  
  const frontendSuccess = check(frontendResponse, {
    'frontend status is 200': (r) => r.status === 200,
    'frontend response time < 2000ms': (r) => r.timings.duration < 2000,
    'frontend contains expected content': (r) => r.body.includes('SparkApply') || r.body.includes('React'),
  });
  
  errorRate.add(!frontendSuccess);
}

export function teardown(data) {
  console.log('Performance test completed');
  console.log(`Test user email: ${data.testUser.email}`);
}
