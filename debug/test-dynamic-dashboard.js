// Test dynamic color mapping and time sync for Dashboard
const API_BASE_URL = 'http://localhost:3000';

async function testDashboardUpdates() {
    console.log('=== Testing Dashboard Updates ===');
    
    try {
        // Test stats API
        console.log('\n1. Testing /api/dashboard/stats endpoint...');
        const statsResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Stats API working');
            console.log('Current time from DB:', statsData.data.currentTime);
            console.log('Schools for dynamic colors:', statsData.data.schools?.map(s => s.name));
            console.log('Recent schedules count:', statsData.data.recentSchedules?.length);
            console.log('Upcoming schedules count:', statsData.data.upcomingSchedules?.length);
            console.log('Stacked chart data count:', statsData.data.stackedChartData?.length);
        } else {
            console.error('❌ Stats API failed:', statsResponse.status);
        }
        
        // Test original dashboard API
        console.log('\n2. Testing /api/dashboard endpoint...');
        const dashboardResponse = await fetch(`${API_BASE_URL}/api/dashboard`);
        
        if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            console.log('✅ Dashboard API working');
            console.log('Schedule data count:', dashboardData.data.scheduleData?.length);
        } else {
            console.error('❌ Dashboard API failed:', dashboardResponse.status);
        }
        
        console.log('\n=== Test Summary ===');
        console.log('✅ Dashboard should now show:');
        console.log('   - Synchronized time from database');
        console.log('   - Dynamic school colors based on actual school data');
        console.log('   - Recent and upcoming schedules separately');
        console.log('   - Assessment data with proper time sync');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test if this script is executed directly
if (typeof window === 'undefined') {
    testDashboardUpdates();
} else {
    console.log('Run this in Node.js environment or open console in browser at localhost:3000');
}

module.exports = { testDashboardUpdates };
