// test/test-schools-api.js
// Simple script to test schools API

const fetch = require('node-fetch');

async function testSchoolsAPI() {
  try {
    console.log('🧪 Testing Schools API...');
    
    const response = await fetch('http://localhost:3000/api/schools');
    const data = await response.json();
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Data type:', typeof data.data);
    console.log('Is array:', Array.isArray(data.data));
    console.log('Schools count:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('📋 First school:', data.data[0]);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testSchoolsAPI();
