// Native fetch in Node.js
// Using ESM module format
import fetch from 'node-fetch';

// Testing quickLogin API endpoint
async function testQuickLoginAPI() {
  try {
    console.log('Testing /api/users?quickLogin=true endpoint...');
    
    const response = await fetch('http://localhost:3000/api/users?quickLogin=true');
    const data = await response.json();
    
    console.log('API Response:', data);
    
    if (data.success) {
      console.log('✅ API returned success!');
      console.log('Users found:', data.data.length);
      console.log('Sample user:', data.data[0]);
    } else {
      console.log('❌ API returned error:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Execute the test
testQuickLoginAPI();
