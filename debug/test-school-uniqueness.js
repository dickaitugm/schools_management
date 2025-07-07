// Test script untuk memverifikasi unique constraint pada school names
console.log('🧪 Testing School Name Uniqueness\n');

async function testSchoolNameUniqueness() {
  try {
    console.log('1. Testing school creation with unique name...');
    
    const uniqueSchool = {
      name: `Test School ${Date.now()}`,
      address: 'Test Address',
      phone: '081234567890',
      email: 'test@example.com'
    };
    
    const response1 = await fetch('/api/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uniqueSchool)
    });
    
    const data1 = await response1.json();
    console.log('✅ Unique school creation:', data1.success ? 'SUCCESS' : 'FAILED');
    
    if (data1.success) {
      const schoolId = data1.data.id;
      const schoolName = data1.data.name;
      
      console.log(`   Created school: "${schoolName}" (ID: ${schoolId})`);
      
      console.log('\n2. Testing duplicate school name creation...');
      
      const duplicateSchool = {
        name: schoolName, // Same name as above
        address: 'Different Address',
        phone: '087654321098',
        email: 'different@example.com'
      };
      
      const response2 = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateSchool)
      });
      
      const data2 = await response2.json();
      
      if (response2.status === 409 && !data2.success) {
        console.log('✅ Duplicate prevention: SUCCESS');
        console.log(`   Error message: "${data2.error}"`);
      } else {
        console.log('❌ Duplicate prevention: FAILED');
        console.log('   Expected 409 conflict, got:', response2.status);
      }
      
      console.log('\n3. Testing update to existing name...');
      
      // Try to update another school to have the same name
      const response3 = await fetch(`/api/schools/${schoolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schoolName, // Same name (should work since it's the same school)
          address: 'Updated Address',
          phone: '081111111111',
          email: 'updated@example.com'
        })
      });
      
      const data3 = await response3.json();
      console.log('✅ Self-update:', data3.success ? 'SUCCESS' : 'FAILED');
      
      console.log('\n4. Cleaning up test data...');
      
      const deleteResponse = await fetch(`/api/schools/${schoolId}`, {
        method: 'DELETE'
      });
      
      const deleteData = await deleteResponse.json();
      console.log('✅ Cleanup:', deleteData.success ? 'SUCCESS' : 'FAILED');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

console.log('Run in browser console: testSchoolNameUniqueness()');

// Export for browser usage
if (typeof window !== 'undefined') {
  window.testSchoolNameUniqueness = testSchoolNameUniqueness;
}
