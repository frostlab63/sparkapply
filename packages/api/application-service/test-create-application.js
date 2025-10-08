
const axios = require('axios');

const API_URL = 'http://localhost:3006/api';

const testCreateApplication = async () => {
  console.log('\n📝 Testing Application Creation...');
  try {
    const response = await axios.post(`${API_URL}/applications/enhanced`, {
      userId: 1,
      jobTitle: 'Software Engineer',
      company: 'Acme Corp',
      status: 'draft',
    });
    if (response.status === 201 && response.data.id) {
      console.log(`✅ PASS: Create Application - ID: ${response.data.id}`);
    } else {
      console.log('❌ FAIL: Create Application - Unexpected response', response.data);
    }
  } catch (error) {
    console.log('❌ FAIL: Create Application', error.response ? error.response.data : error.message);
  }
};

const runTests = async () => {
  console.log('🚀 Starting Focused Application Creation Test');
  await testCreateApplication();
  console.log('\n🏁 Test finished.');
};

runTests();

