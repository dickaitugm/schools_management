// Test time display in schedules
const API_BASE_URL = 'http://localhost:3000';

async function testScheduleTimeDisplay() {
    console.log('=== Testing Schedule Time Display ===');
    
    try {
        // Test stats API untuk melihat data schedules dengan waktu
        console.log('\n1. Testing schedule time data from /api/dashboard/stats...');
        const statsResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            
            console.log('✅ Stats API working');
            console.log('\nUpcoming Schedules with Time:');
            if (statsData.data.upcomingSchedules && statsData.data.upcomingSchedules.length > 0) {
                statsData.data.upcomingSchedules.slice(0, 2).forEach((schedule, index) => {
                    console.log(`  ${index + 1}. ${schedule.school_name}`);
                    console.log(`     📅 Date: ${schedule.scheduled_date}`);
                    console.log(`     ⏰ Time: ${schedule.scheduled_time || 'N/A'}`);
                    console.log(`     📋 Status: ${schedule.status}`);
                    console.log('');
                });
            } else {
                console.log('  No upcoming schedules found');
            }
            
            console.log('Recent Schedules with Time:');
            if (statsData.data.recentSchedules && statsData.data.recentSchedules.length > 0) {
                statsData.data.recentSchedules.slice(0, 2).forEach((schedule, index) => {
                    console.log(`  ${index + 1}. ${schedule.school_name}`);
                    console.log(`     📅 Date: ${schedule.scheduled_date}`);
                    console.log(`     ⏰ Time: ${schedule.scheduled_time || 'N/A'}`);
                    console.log(`     📋 Status: ${schedule.status}`);
                    console.log('');
                });
            } else {
                console.log('  No recent schedules found');
            }
            
        } else {
            console.error('❌ Stats API failed:', statsResponse.status);
        }
        
        console.log('=== Time Display Summary ===');
        console.log('✅ Dashboard should now show:');
        console.log('   - Upcoming schedules with date AND time');
        console.log('   - Recent schedules with date AND time');
        console.log('   - Time format: HH:MM (24-hour format)');
        console.log('   - Assessment data for completed schedules only');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test if this script is executed directly
if (typeof window === 'undefined') {
    testScheduleTimeDisplay();
} else {
    console.log('Run this in Node.js environment or open console in browser at localhost:3000');
}

module.exports = { testScheduleTimeDisplay };
