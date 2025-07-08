#!/usr/bin/env node

// Test script untuk memverifikasi Recent & Upcoming logic
console.log('Testing Recent & Upcoming Schedule Logic...');

const testSchedules = [
  {
    id: 1,
    school_name: 'Rusunawa Cibuluh',
    scheduled_date: '2025-07-10T00:00:00',
    scheduled_time: '15:30:00',
    status: 'scheduled',
    duration_minutes: 120
  },
  {
    id: 2,
    school_name: 'Rusunawa Cibuluh', 
    scheduled_date: '2025-06-27T00:00:00',
    scheduled_time: '15:30:00',
    status: 'completed',
    duration_minutes: 120,
    assessed_students: 2,
    total_students: 2
  },
  {
    id: 3,
    school_name: 'School XYZ',
    scheduled_date: '2025-07-05T00:00:00',
    scheduled_time: '10:00:00',
    status: 'in-progress',
    duration_minutes: 90
  }
];

const isScheduleInFuture = (scheduledDate, scheduledTime) => {
  const now = new Date();
  const scheduleDateTime = new Date(`${scheduledDate.split('T')[0]}T${scheduledTime}`);
  return scheduleDateTime > now;
};

const now = new Date();
console.log('Current time:', now.toISOString());
console.log('---');

const recentSchedules = [];
const upcomingSchedules = [];

testSchedules.forEach(schedule => {
  const isFuture = isScheduleInFuture(schedule.scheduled_date, schedule.scheduled_time);
  
  console.log(`Schedule ID ${schedule.id}:`);
  console.log(`  School: ${schedule.school_name}`);
  console.log(`  Date/Time: ${schedule.scheduled_date} ${schedule.scheduled_time}`);
  console.log(`  Status: ${schedule.status}`);
  console.log(`  Duration: ${schedule.duration_minutes} minutes`);
  console.log(`  Is Future: ${isFuture}`);
  console.log(`  Category: ${isFuture ? 'UPCOMING' : 'RECENT'}`);
  
  if (schedule.assessed_students && schedule.total_students) {
    console.log(`  Students: ${schedule.assessed_students}/${schedule.total_students} assessed`);
  }
  
  if (isFuture) {
    upcomingSchedules.push(schedule);
  } else {
    recentSchedules.push(schedule);
  }
  
  console.log('---');
});

console.log(`Summary:`);
console.log(`  Recent schedules: ${recentSchedules.length}`);
console.log(`  Upcoming schedules: ${upcomingSchedules.length}`);

// Test title logic
const recentCount = recentSchedules.length;
const upcomingCount = upcomingSchedules.length;

let expectedTitle;
if (recentCount > 0 && upcomingCount > 0) {
  expectedTitle = 'Recent & Upcoming Schedules';
} else if (recentCount > 0) {
  expectedTitle = 'Recent Schedules';
} else if (upcomingCount > 0) {
  expectedTitle = 'Upcoming Schedules';
} else {
  expectedTitle = 'Schedules';
}

console.log(`  Expected title: "${expectedTitle}"`);

console.log('\nTest completed successfully!');
