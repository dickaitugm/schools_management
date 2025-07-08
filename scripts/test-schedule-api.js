// Test script to check schedule API with upcoming parameter
const testScheduleAPI = async () => {
  console.log('Testing schedule API with upcoming parameter...');
  
  try {
    // Test upcoming schedules
    const upcomingResponse = await fetch('/api/schedules?upcoming=true&limit=5');
    const upcomingData = await upcomingResponse.json();
    
    console.log('Upcoming schedules:', upcomingData.data?.length || 0);
    
    // Test all schedules
    const allResponse = await fetch('/api/schedules?limit=10');
    const allData = await allResponse.json();
    
    console.log('All schedules:', allData.data?.length || 0);
    
    if (upcomingData.data) {
      upcomingData.data.forEach(schedule => {
        const scheduleDateTime = new Date(`${schedule.scheduled_date.split('T')[0]}T${schedule.scheduled_time}`);
        const now = new Date();
        const isFuture = scheduleDateTime > now;
        
        console.log(`Schedule ${schedule.id}: ${schedule.scheduled_date} ${schedule.scheduled_time} - ${isFuture ? 'FUTURE' : 'PAST'}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

// Run the test when DOM is loaded
if (typeof window !== 'undefined') {
  window.testScheduleAPI = testScheduleAPI;
}

module.exports = { testScheduleAPI };
