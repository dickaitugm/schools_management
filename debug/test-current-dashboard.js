const fetch = require('node-fetch');

async function testCurrentDashboard() {
  try {
    console.log('🔍 Testing current dashboard state...');
    
    const response = await fetch('http://localhost:3000/api/dashboard');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API Error:', result.error);
      return;
    }
    
    console.log('✅ API Success');
    console.log('📊 Stats:', {
      schools: result.data.schools,
      teachers: result.data.teachers,
      students: result.data.students,
      lessons: result.data.lessons,
      schedules: result.data.schedules
    });
    
    console.log('\n📅 Schedule Data Check:');
    const schedules = result.data.scheduleData || [];
    console.log(`Total schedules: ${schedules.length}`);
    
    if (schedules.length > 0) {
      console.log('\nFirst 3 schedules:');
      schedules.slice(0, 3).forEach((schedule, index) => {
        console.log(`${index + 1}. ${schedule.school_name}`);
        console.log(`   Date: ${schedule.scheduled_date}`);
        console.log(`   Status: ${schedule.status}`);
        console.log(`   Student Count: ${schedule.student_count}`);
        console.log(`   Total Students: ${schedule.total_school_students}`);
        
        // Check assessment data
        if (schedule.status === 'completed') {
          console.log('   Assessment Averages:');
          console.log(`     Personal: ${schedule.avg_personal_development || 'null'}`);
          console.log(`     Critical: ${schedule.avg_critical_thinking || 'null'}`);
          console.log(`     Team Work: ${schedule.avg_team_work || 'null'}`);
          console.log(`     Academic: ${schedule.avg_academic_knowledge || 'null'}`);
          console.log(`     Overall: ${schedule.overall_average || 'null'}`);
        }
        console.log('');
      });
    }
    
    console.log('\n✅ Test completed - Dashboard API is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCurrentDashboard();
