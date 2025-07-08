#!/usr/bin/env node

// Test script untuk menguji fitur Recent & Upcoming Schedules
console.log('Testing Recent & Upcoming Schedules functionality...');

// Test helper functions
const testScheduleStatusLogic = () => {
  const testSchedules = [
    {
      id: 1,
      scheduled_date: '2025-07-10T00:00:00',
      scheduled_time: '15:30:00',
      status: 'scheduled'
    },
    {
      id: 2,
      scheduled_date: '2025-06-05T00:00:00', 
      scheduled_time: '15:30:00',
      status: 'completed'
    }
  ];

  const now = new Date();
  console.log('Current time:', now.toISOString());

  testSchedules.forEach(schedule => {
    const scheduleDateTime = new Date(`${schedule.scheduled_date.split('T')[0]}T${schedule.scheduled_time}`);
    const isFuture = scheduleDateTime > now;
    
    console.log(`Schedule ${schedule.id}:`);
    console.log(`  Date/Time: ${schedule.scheduled_date} ${schedule.scheduled_time}`);
    console.log(`  Status: ${schedule.status}`);
    console.log(`  Is Future: ${isFuture}`);
    console.log(`  Should show as: ${isFuture ? 'Upcoming' : 'Recent'}`);
    console.log('---');
  });
};

try {
  testScheduleStatusLogic();
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Test failed:', error);
}
