// Test browser console untuk cek dashboard data
console.log('🔍 Testing dashboard state in browser...');

fetch('/api/dashboard')
  .then(response => response.json())
  .then(result => {
    console.log('✅ Dashboard API Response:', result);
    
    if (result.success) {
      console.log('📊 Stats:', result.data);
      
      const schedules = result.data.scheduleData || [];
      console.log('📅 Schedules count:', schedules.length);
      
      if (schedules.length > 0) {
        console.log('Sample schedule:', schedules[0]);
        
        // Check for assessment data
        const completedSchedules = schedules.filter(s => s.status === 'completed');
        console.log('Completed schedules with assessment data:');
        completedSchedules.slice(0, 2).forEach((schedule, index) => {
          console.log(`${index + 1}. ${schedule.school_name}:`);
          console.log(`   Personal Dev: ${schedule.avg_personal_development}`);
          console.log(`   Critical Thinking: ${schedule.avg_critical_thinking}`);
          console.log(`   Team Work: ${schedule.avg_team_work}`);
          console.log(`   Academic: ${schedule.avg_academic_knowledge}`);
          console.log(`   Overall: ${schedule.overall_average}`);
        });
      }
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });

console.log('🎯 Script loaded - check console for results!');
