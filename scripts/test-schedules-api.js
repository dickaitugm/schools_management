async function testSchedulesAPI() {
  try {
    console.log('Testing Schedules API with Student Count...\n');
    
    const response = await fetch('http://localhost:3000/api/schedules?limit=3');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Response Success');
      console.log('Total schedules:', data.data.length);
      
      data.data.forEach((schedule, index) => {
        console.log(`\n--- Schedule ${index + 1} ---`);
        console.log(`ID: ${schedule.id}`);
        console.log(`School: ${schedule.school_name}`);
        console.log(`Date: ${schedule.scheduled_date}`);
        console.log(`Total Students: ${schedule.total_students || 'N/A'}`);
        console.log(`Assessed Students: ${schedule.assessed_students || 'N/A'}`);
        console.log(`Status: ${schedule.status}`);
        console.log(`Teachers: ${schedule.teachers ? schedule.teachers.length : 0}`);
        console.log(`Lessons: ${schedule.lessons ? schedule.lessons.length : 0}`);
      });
    } else {
      console.error('❌ API Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testSchedulesAPI();
