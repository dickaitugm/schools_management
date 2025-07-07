// Test script untuk debug Teacher Management - Schools loading
console.log('🧪 Testing Schools API for Teacher Management\n');

async function testSchoolsAPI() {
  try {
    console.log('Fetching schools from /api/schools...');
    const response = await fetch('http://localhost:3000/api/schools');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success && Array.isArray(data.data)) {
      console.log(`✅ Schools loaded successfully: ${data.data.length} schools`);
      data.data.forEach((school, index) => {
        console.log(`  ${index + 1}. ${school.name} (ID: ${school.id})`);
      });
    } else {
      console.log('❌ Unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Error fetching schools:', error);
  }
}

async function testTeacherCreation() {
  try {
    const testData = {
      name: 'Test Teacher',
      subject: 'Mathematics',
      phone: '081234567890',
      email: 'test.teacher@example.com',
      hire_date: '2024-01-15',
      school_ids: [1, 2] // Assuming schools with ID 1 and 2 exist
    };
    
    console.log('\n🧪 Testing Teacher Creation...');
    console.log('Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/teachers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Teacher created successfully');
      if (data.data.schools) {
        console.log(`Schools assigned: ${data.data.schools.length}`);
      }
    } else {
      console.log('❌ Teacher creation failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error creating teacher:', error);
  }
}

// Run tests if this is executed directly in browser console
if (typeof window !== 'undefined') {
  console.log('Running browser tests...');
  testSchoolsAPI();
  // Don't run teacher creation test automatically to avoid duplicate data
} else {
  console.log('This script should be run in browser console');
}
