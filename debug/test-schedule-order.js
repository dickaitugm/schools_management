// Test upcoming and recent schedules order change
const API_BASE_URL = 'http://localhost:3000';

async function testScheduleOrder() {
    console.log('=== Testing Schedule Card Order ===');
    
    try {
        // Test stats API untuk melihat data schedules
        console.log('\n1. Testing schedule data from /api/dashboard/stats...');
        const statsResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            
            console.log('✅ Stats API working');
            console.log('\nUpcoming Schedules:');
            if (statsData.data.upcomingSchedules && statsData.data.upcomingSchedules.length > 0) {
                statsData.data.upcomingSchedules.slice(0, 2).forEach((schedule, index) => {
                    console.log(`  ${index + 1}. ${schedule.school_name} - ${schedule.scheduled_date} (${schedule.status})`);
                });
            } else {
                console.log('  No upcoming schedules found');
            }
            
            console.log('\nRecent Schedules:');
            if (statsData.data.recentSchedules && statsData.data.recentSchedules.length > 0) {
                statsData.data.recentSchedules.slice(0, 2).forEach((schedule, index) => {
                    console.log(`  ${index + 1}. ${schedule.school_name} - ${schedule.scheduled_date} (${schedule.status})`);
                });
            } else {
                console.log('  No recent schedules found');
            }
            
        } else {
            console.error('❌ Stats API failed:', statsResponse.status);
        }
        
        console.log('\n=== Dashboard Order Summary ===');
        console.log('✅ Dashboard should now show:');
        console.log('   1. Card title: "Upcoming & Recent Schedules"');
        console.log('   2. First section: "Upcoming" (max 2 schedules)');
        console.log('   3. Second section: "Recent" (max 2 schedules)');
        console.log('   4. Assessment data only shown for completed schedules');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test if this script is executed directly
if (typeof window === 'undefined') {
    testScheduleOrder();
} else {
    console.log('Run this in Node.js environment or open console in browser at localhost:3000');
}

module.exports = { testScheduleOrder };
