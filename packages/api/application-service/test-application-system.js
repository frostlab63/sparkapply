const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3005/api';
const TEST_USER_ID = 1;

const testApplication = {
  userId: TEST_USER_ID,
  company: 'TechCorp Inc.',
  jobTitle: 'Senior Software Engineer',
  status: 'applied',
  priority: 'high',
  expectedSalary: 120000,
  location: 'San Francisco, CA',
  workType: 'hybrid',
  jobUrl: 'https://example.com/job/123',
  notes: 'Great company culture, exciting product'
};

const testInterview = {
  type: 'technical',
  duration: 60,
  location: 'Virtual - Zoom',
  interviewers: [
    { name: 'John Smith', title: 'Senior Engineer', email: 'john@techcorp.com' },
    { name: 'Jane Doe', title: 'Engineering Manager', email: 'jane@techcorp.com' }
  ],
  notes: 'Technical interview focusing on system design',
  preparationTime: 30,
  userId: TEST_USER_ID
};

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name: testName, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function createTestDocument() {
  const testContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
  return testContent;
}

async function runTests() {
  console.log('🚀 Starting Advanced Job Application Management System Tests\n');
  
  let applicationId, interviewId, documentId;

  try {
    console.log('📝 Testing Application Management...');
    try {
      const response = await axios.post(`${BASE_URL}/applications`, testApplication);
      applicationId = response.data.data.id;
      
      logTest('Create Application with Intelligence', 
        response.status === 201 && response.data.success,
        `Application ID: ${applicationId}`
      );
    } catch (error) {
      logTest('Create Application with Intelligence', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/applications/${TEST_USER_ID}?includeAnalytics=true`);
      
      logTest('Get Applications with Analytics', 
        response.status === 200 && response.data.data.analytics,
        `Found ${response.data.data.applications.length} applications`
      );
    } catch (error) {
      logTest('Get Applications with Analytics', false, error.message);
    }

    try {
      const updateData = {
        status: 'phone_screening',
        notes: 'Received call for phone screening'
      };
      
      const response = await axios.put(`${BASE_URL}/applications/${applicationId}`, updateData);
      
      logTest('Update Application with Automation', 
        response.status === 200 && response.data.data.status === 'phone_screening',
        'Status updated with automation'
      );
    } catch (error) {
      logTest('Update Application with Automation', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/applications/analytics/${TEST_USER_ID}`);
      
      logTest('Get Application Analytics', 
        response.status === 200 && response.data.data.metrics,
        `Response rate: ${response.data.data.metrics.responseRate}%`
      );
    } catch (error) {
      logTest('Get Application Analytics', false, error.message);
    }

    console.log('\n📅 Testing Interview Management...');
    try {
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const interviewData = {
        ...testInterview,
        applicationId,
        scheduledDate: scheduledDate.toISOString()
      };
      
      const response = await axios.post(`${BASE_URL}/interviews`, interviewData);
      interviewId = response.data.data.id;
      
      logTest('Schedule Interview with Conflict Detection', 
        response.status === 201 && response.data.success,
        `Interview ID: ${interviewId}`
      );
    } catch (error) {
      logTest('Schedule Interview with Conflict Detection', false, error.message);
    }

    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const response = await axios.get(`${BASE_URL}/interviews/available-slots/${TEST_USER_ID}?date=${dateStr}&duration=60`);
      
      logTest('Get Available Time Slots', 
        response.status === 200 && response.data.data.timeSlots,
        `Found ${response.data.data.timeSlots.length} available slots`
      );
    } catch (error) {
      logTest('Get Available Time Slots', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/interviews/upcoming/${TEST_USER_ID}`);
      
      logTest('Get Upcoming Interviews with Preparation', 
        response.status === 200 && response.data.data,
        `Found ${response.data.data.length} upcoming interviews`
      );
    } catch (error) {
      logTest('Get Upcoming Interviews with Preparation', false, error.message);
    }

    if (interviewId) {
      try {
        const response = await axios.get(`${BASE_URL}/interviews/preparation/${interviewId}`);
        
        logTest('Get Interview Preparation Checklist', 
          response.status === 200 && response.data.data.checklist,
          `Checklist has ${response.data.data.checklist.length} categories`
        );
      } catch (error) {
        logTest('Get Interview Preparation Checklist', false, error.message);
      }
    }

    if (interviewId) {
      try {
        const response = await axios.put(`${BASE_URL}/interviews/${interviewId}`, {
          status: 'completed',
          feedback: 'Great technical discussion, positive feedback'
        });
        
        logTest('Update Interview Status with Automation', 
          response.status === 200 && response.data.data.status === 'completed',
          'Interview marked as completed with automation'
        );
      } catch (error) {
        logTest('Update Interview Status with Automation', false, error.message);
      }
    }

    try {
      const response = await axios.get(`${BASE_URL}/interviews/analytics/${TEST_USER_ID}`);
      
      logTest('Get Interview Analytics', 
        response.status === 200 && response.data.data,
        `Success rate: ${response.data.data.successRate}%`
      );
    } catch (error) {
      logTest('Get Interview Analytics', false, error.message);
    }

    console.log('\n📄 Testing Document Management...');
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      const testDoc = createTestDocument();
      form.append('document', testDoc, 'test-resume.pdf');
      if (applicationId) {
        form.append('applicationId', applicationId.toString());
      } else {
        logTest('Upload Document', false, 'Skipping due to missing applicationId');
        return;
      }
      form.append('userId', TEST_USER_ID.toString());
      form.append('type', 'resume');
      form.append('title', 'Test Resume');
      form.append('description', 'Test resume document');
      form.append('tags', JSON.stringify(['resume', 'test']));
      
      const response = await axios.post(`${BASE_URL}/documents/upload`, form, {
        headers: form.getHeaders()
      });
      
      documentId = response.data.data.id;
      
      logTest('Upload Document', 
        response.status === 201 && response.data.success,
        `Document ID: ${documentId}`
      );
    } catch (error) {
      logTest('Upload Document', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/documents/search/${TEST_USER_ID}?type=resume&limit=10`);
      
      logTest('Search Documents with Filtering', 
        response.status === 200 && response.data.data.documents,
        `Found ${response.data.data.documents.length} documents`
      );
    } catch (error) {
      logTest('Search Documents with Filtering', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/documents/organization/${TEST_USER_ID}`);
      
      logTest('Get Document Organization', 
        response.status === 200 && response.data.data,
        `Total documents: ${response.data.data.statistics.totalDocuments}`
      );
    } catch (error) {
      logTest('Get Document Organization', false, error.message);
    }

    if (documentId) {
      console.log(`Attempting to update metadata for documentId: ${documentId}`);
      try {
        const response = await axios.put(`${BASE_URL}/documents/metadata/${documentId}`, {
          title: 'Updated Test Resume',
          description: 'Updated test resume document',
          tags: ['resume', 'test', 'updated']
        });
        
        logTest('Update Document Metadata', 
          response.status === 200 && response.data.data.title === 'Updated Test Resume',
          'Document metadata updated successfully'
        );
      } catch (error) {
        logTest('Update Document Metadata', false, error.message);
      }
    }

    try {
      const response = await axios.get(`${BASE_URL}/documents/analytics/${TEST_USER_ID}`);
      
      logTest('Get Document Analytics', 
        response.status === 200 && response.data.data,
        `Total size: ${Math.round(response.data.data.totalSize / 1024)}KB`
      );
    } catch (error) {
      logTest('Get Document Analytics', false, error.message);
    }

    console.log('\n🔄 Testing Bulk Operations...');
    try {
      const response = await axios.post(`${BASE_URL}/applications/bulk/${TEST_USER_ID}`, {
        operation: 'update_status',
        applicationIds: [applicationId],
        data: {
          status: 'interviewed',
          notes: 'Bulk updated via test'
        }
      });
      
      logTest('Bulk Update Applications', 
        response.status === 200 && response.data.results.successCount > 0,
        `Updated ${response.data.results.successCount} applications`
      );
    } catch (error) {
      logTest('Bulk Update Applications', false, error.message);
    }

    console.log('\n📊 Testing Dashboard Features...');
    try {
      const response = await axios.get(`${BASE_URL}/applications/dashboard/${TEST_USER_ID}`);
      
      logTest('Get Application Dashboard', 
        response.status === 200 && response.data.data.summary,
        `Total applications: ${response.data.data.summary.totalApplications}`
      );
    } catch (error) {
      logTest('Get Application Dashboard', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/interviews/dashboard/${TEST_USER_ID}`);
      
      logTest('Get Interview Dashboard', 
        response.status === 200 && response.data.data,
        `Upcoming interviews: ${response.data.data.upcoming.summary.total}`
      );
    } catch (error) {
      logTest('Get Interview Dashboard', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/documents/dashboard/${TEST_USER_ID}`);
      
      logTest('Get Document Dashboard', 
        response.status === 200 && response.data.data.summary,
        `Total documents: ${response.data.data.summary.totalDocuments}`
      );
    } catch (error) {
      logTest('Get Document Dashboard', false, error.message);
    }

    console.log('\n💡 Testing AI Insights and Suggestions...');
    try {
      const response = await axios.get(`${BASE_URL}/applications/suggestions/${TEST_USER_ID}`);
      
      logTest('Get Application Suggestions', 
        response.status === 200 && response.data.data.suggestions,
        `Generated ${response.data.data.suggestions.length} suggestions`
      );
    } catch (error) {
      logTest('Get Application Suggestions', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/interviews/suggestions/${TEST_USER_ID}`);
      
      logTest('Get Interview Suggestions', 
        response.status === 200 && response.data.data.suggestions,
        `Generated ${response.data.data.suggestions.length} suggestions`
      );
    } catch (error) {
      logTest('Get Interview Suggestions', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/documents/suggestions/${TEST_USER_ID}`);
      
      logTest('Get Document Suggestions', 
        response.status === 200 && response.data.data.suggestions,
        `Generated ${response.data.data.suggestions.length} suggestions`
      );
    } catch (error) {
      logTest('Get Document Suggestions', false, error.message);
    }

    console.log('\n📤 Testing Data Export...');
    try {
      const response = await axios.get(`${BASE_URL}/applications/export/${TEST_USER_ID}?format=json`);
      
      logTest('Export Application Data (JSON)', 
        response.status === 200 && Array.isArray(response.data),
        `Exported ${response.data.length} applications`
      );
    } catch (error) {
      logTest('Export Application Data (JSON)', false, error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/interviews/calendar/${TEST_USER_ID}?view=month`);
      logTest('Get Interview Calendar', 
        response.status === 200 && response.data.data.calendar,
        `Calendar data: ${JSON.stringify(response.data.data)}`
      );
    } catch (error) {
      logTest('Get Interview Calendar', false, error.message);
    }

    console.log('\n🏥 Testing System Health...');
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
      const responseTime = Date.now() - startTime;
      
      logTest('System Health Check', 
        response.status === 200 && response.data.status === 'OK',
        `Response time: ${responseTime}ms`
      );
    } catch (error) {
      logTest('System Health Check', false, error.message);
    }

  } catch (error) {
    console.error('Test suite error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
  }

  fs.writeFileSync(path.join(__dirname, 'test-results.json'), JSON.stringify(testResults, null, 2));
  console.log('📄 Detailed results saved to test-results.json');
}

runTests();

