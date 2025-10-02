#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load test configuration
const config = {
  target: process.env.LOAD_TEST_TARGET || 'http://localhost:3001',
  phases: [
    { duration: '2m', arrivalRate: 5, name: 'Warm up' },
    { duration: '5m', arrivalRate: 10, name: 'Ramp up load' },
    { duration: '10m', arrivalRate: 20, name: 'Sustained load' },
    { duration: '2m', arrivalRate: 50, name: 'Peak load' },
    { duration: '5m', arrivalRate: 10, name: 'Cool down' }
  ],
  scenarios: [
    {
      name: 'User Registration and Login Flow',
      weight: 30,
      flow: [
        {
          post: {
            url: '/api/v1/auth/register',
            json: {
              email: '{{ $randomEmail }}',
              password: 'TestPassword123!',
              confirmPassword: 'TestPassword123!',
              firstName: '{{ $randomFirstName }}',
              lastName: '{{ $randomLastName }}',
              role: 'job_seeker'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        {
          post: {
            url: '/api/v1/auth/login',
            json: {
              email: '{{ email }}',
              password: 'TestPassword123!'
            }
          }
        }
      ]
    },
    {
      name: 'Job Search and Application',
      weight: 50,
      flow: [
        {
          get: {
            url: '/api/v1/jobs',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          get: {
            url: '/api/v1/jobs/search?q=developer&location=remote',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          post: {
            url: '/api/v1/applications',
            json: {
              jobId: '{{ $randomUUID }}',
              coverLetter: 'Generated cover letter content...'
            },
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        }
      ]
    },
    {
      name: 'User Profile Management',
      weight: 20,
      flow: [
        {
          get: {
            url: '/api/v1/users/profile',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          put: {
            url: '/api/v1/users/profile',
            json: {
              firstName: '{{ $randomFirstName }}',
              lastName: '{{ $randomLastName }}',
              bio: 'Updated bio content...'
            },
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        }
      ]
    }
  ]
};

// Generate Artillery configuration file
const artilleryConfig = {
  config: {
    target: config.target,
    phases: config.phases,
    variables: {
      randomEmail: ['test1@example.com', 'test2@example.com', 'test3@example.com'],
      randomFirstName: ['John', 'Jane', 'Mike', 'Sarah', 'David'],
      randomLastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones']
    },
    plugins: {
      'artillery-plugin-metrics-by-endpoint': {},
      'artillery-plugin-statsd': {
        host: 'localhost',
        port: 8125,
        prefix: 'sparkapply.loadtest'
      }
    }
  },
  scenarios: config.scenarios
};

// Write Artillery configuration
const configPath = path.join(__dirname, 'artillery-config.yml');
fs.writeFileSync(configPath, `# SparkApply Load Test Configuration
# Generated automatically - do not edit manually

config:
  target: ${config.target}
  phases:
${config.phases.map(phase => `    - duration: ${phase.duration}
      arrivalRate: ${phase.arrivalRate}
      name: "${phase.name}"`).join('\n')}
  
  variables:
    randomEmail:
      - "test{{ $randomInt(1, 1000) }}@loadtest.com"
    randomFirstName:
      - "TestUser{{ $randomInt(1, 1000) }}"
    randomLastName:
      - "LoadTest{{ $randomInt(1, 1000) }}"

scenarios:
  - name: "Health Check"
    weight: 10
    flow:
      - get:
          url: "/api/v1/health"
          
  - name: "User Registration Flow"
    weight: 30
    flow:
      - post:
          url: "/api/v1/auth/register"
          json:
            email: "loadtest{{ $randomInt(1, 10000) }}@example.com"
            password: "TestPassword123!"
            confirmPassword: "TestPassword123!"
            firstName: "{{ randomFirstName }}"
            lastName: "{{ randomLastName }}"
            role: "job_seeker"
          capture:
            - json: "$.token"
              as: "authToken"
      - think: 2
      - get:
          url: "/api/v1/users/profile"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "User Login Flow"
    weight: 40
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "existing@example.com"
            password: "TestPassword123!"
          capture:
            - json: "$.token"
              as: "authToken"
      - think: 1
      - get:
          url: "/api/v1/users/profile"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "API Endpoints Stress Test"
    weight: 20
    flow:
      - get:
          url: "/api/v1/health"
      - think: 0.5
      - get:
          url: "/api/v1/jobs"
      - think: 1
      - get:
          url: "/api/v1/jobs/search?q=developer"
`);

console.log('🚀 SparkApply Load Testing Suite');
console.log('================================');
console.log(`Target: ${config.target}`);
console.log(`Configuration saved to: ${configPath}`);

// Check if Artillery is installed
try {
  execSync('artillery --version', { stdio: 'ignore' });
} catch (error) {
  console.log('📦 Installing Artillery...');
  execSync('npm install -g artillery', { stdio: 'inherit' });
}

// Run the load test
console.log('\n🎯 Starting load test...');
console.log('This will run for approximately 24 minutes');
console.log('Monitor the results in real-time\n');

try {
  const command = `artillery run ${configPath} --output load-test-results.json`;
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ Load test completed!');
  console.log('📊 Generating HTML report...');
  
  execSync(`artillery report load-test-results.json --output load-test-report.html`, { stdio: 'inherit' });
  
  console.log('📈 Report generated: load-test-report.html');
  console.log('🔍 Raw results: load-test-results.json');
  
} catch (error) {
  console.error('❌ Load test failed:', error.message);
  process.exit(1);
}
