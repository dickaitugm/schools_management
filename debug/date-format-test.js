// Test script untuk memverifikasi format tanggal Indonesia

console.log('🧪 Testing Indonesian Date Format Utility\n');

// Mock utility functions for testing (since ES modules need different setup)
const formatDateIndonesian = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${day} ${month} ${year}`;
};

const formatTimeIndonesian = (timeString) => {
  if (!timeString) return 'N/A';
  return timeString.slice(0, 5); // HH:MM format
};

const formatDateTimeIndonesian = (dateString, timeString) => {
  if (!dateString) return 'N/A';
  const date = formatDateIndonesian(dateString);
  const time = timeString ? formatTimeIndonesian(timeString) : '';
  return time ? `${date} ${time}` : date;
};

// Test data
const testDates = [
  '2024-01-15',
  '2024-12-25', 
  '2024-06-17',
  '2024-08-31'
];

const testTimes = [
  '09:00:00',
  '14:30:00',
  '08:15:00',
  '16:45:00'
];

console.log('📅 Testing formatDateIndonesian:');
testDates.forEach(date => {
  const formatted = formatDateIndonesian(date);
  console.log(`  ${date} → ${formatted}`);
});

console.log('\n⏰ Testing formatTimeIndonesian:');
testTimes.forEach(time => {
  const formatted = formatTimeIndonesian(time);
  console.log(`  ${time} → ${formatted}`);
});

console.log('\n📅⏰ Testing formatDateTimeIndonesian:');
testDates.forEach((date, index) => {
  const time = testTimes[index];
  const formatted = formatDateTimeIndonesian(date, time);
  console.log(`  ${date} ${time} → ${formatted}`);
});

console.log('\n✅ Test completed! Format: "Hari, DD MMM YYYY HH:MM"');
