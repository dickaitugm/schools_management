// Test API endpoints untuk debugging
const fetch = require('node-fetch');

async function testAPIs() {
    console.log('🧪 Testing API endpoints...\n');
    
    const baseURL = 'http://localhost:3000';
    
    // Test Users API
    console.log('1. Testing Users API...');
    try {
        const response = await fetch(`${baseURL}/api/users`);
        const data = await response.json();
        console.log('   Users API Response:', data);
        console.log('   Status:', response.status);
        console.log('   Users count:', data.success ? data.data.length : 'Error');
    } catch (error) {
        console.error('   Users API Error:', error.message);
    }
    
    // Test Roles API
    console.log('\n2. Testing Roles API...');
    try {
        const response = await fetch(`${baseURL}/api/roles?include_permissions=true`);
        const data = await response.json();
        console.log('   Roles API Response:', data);
        console.log('   Status:', response.status);
        console.log('   Roles count:', data.success ? data.data.length : 'Error');
    } catch (error) {
        console.error('   Roles API Error:', error.message);
    }
    
    // Test Permissions API
    console.log('\n3. Testing Permissions API...');
    try {
        const response = await fetch(`${baseURL}/api/permissions`);
        const data = await response.json();
        console.log('   Permissions API Response:', data);
        console.log('   Status:', response.status);
        console.log('   Permissions count:', data.success ? data.data.length : 'Error');
    } catch (error) {
        console.error('   Permissions API Error:', error.message);
    }
}

testAPIs();
