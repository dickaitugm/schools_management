// Test script for school deletion API
import fetch from 'node-fetch';

const testSchoolDeletion = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing School Deletion API...');
    
    // Test 1: Check relations for a school
    console.log('\n1️⃣ Testing check-relations endpoint...');
    const checkResponse = await fetch(`${baseUrl}/api/schools/3/check-relations`);
    const checkData = await checkResponse.json();
    
    console.log('Check Relations Response:', JSON.stringify(checkData, null, 2));
    
    if (checkData.success && checkData.hasRelations) {
      console.log('✅ School has relations - showing confirmation modal would appear');
      console.log(`📊 Relation counts:
        - Students: ${checkData.studentsCount}
        - Teacher Schools: ${checkData.teacherSchoolsCount}
        - Cash Flow: ${checkData.cashFlowCount}
        - Attendance: ${checkData.attendanceCount}
        - Student Teachers: ${checkData.studentTeachersCount}`);
    } else {
      console.log('ℹ️ School has no relations - direct delete would proceed');
    }
    
    // Test 2: Try delete without cascade (should fail if has relations)
    console.log('\n2️⃣ Testing delete without cascade...');
    const deleteResponse = await fetch(`${baseUrl}/api/schools/3`, {
      method: 'DELETE'
    });
    const deleteData = await deleteResponse.json();
    
    console.log('Delete Response:', JSON.stringify(deleteData, null, 2));
    
    if (!deleteData.success && deleteData.code === 'FOREIGN_KEY_VIOLATION') {
      console.log('✅ Correctly blocked deletion due to relations');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testSchoolDeletion();
