// Simple test for school deletion API using curl commands
const { exec } = require('child_process');

const runTest = () => {
  console.log('🧪 Testing School Deletion API using curl...\n');
  
  // Test 1: Check relations
  console.log('1️⃣ Testing check-relations endpoint...');
  exec('curl -s "http://localhost:3000/api/schools/3/check-relations"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error checking relations:', error.message);
      return;
    }
    
    try {
      const data = JSON.parse(stdout);
      console.log('✅ Check Relations Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.hasRelations) {
        console.log('📊 School has relations - confirmation modal would appear');
      }
    } catch (e) {
      console.log('Raw response:', stdout);
    }
    
    // Test 2: Try delete without cascade
    console.log('\n2️⃣ Testing delete without cascade...');
    exec('curl -s -X DELETE "http://localhost:3000/api/schools/3"', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error deleting:', error.message);
        return;
      }
      
      try {
        const data = JSON.parse(stdout);
        console.log('✅ Delete Response:', JSON.stringify(data, null, 2));
        
        if (!data.success && data.code === 'FOREIGN_KEY_VIOLATION') {
          console.log('✅ Correctly blocked deletion due to relations');
        }
      } catch (e) {
        console.log('Raw response:', stdout);
      }
      
      console.log('\n🎉 Test completed!');
    });
  });
};

runTest();
