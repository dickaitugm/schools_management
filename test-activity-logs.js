const sampleLogs = [
  {
    user_id: 'admin1',
    user_name: 'Administrator',
    user_role: 'admin',
    action: 'login',
    description: 'Admin logged into system',
    user_agent: 'Mozilla/5.0 Test Browser',
    session_id: 'admin-session-123'
  },
  {
    user_id: 'teacher1',
    user_name: 'John Doe',
    user_role: 'teacher',
    action: 'view_assessment',
    description: 'Viewed student assessment for Schedule #123',
    user_agent: 'Mozilla/5.0 Test Browser',
    session_id: 'teacher-session-456'
  },
  {
    user_id: 'guest',
    user_name: 'Guest User',
    user_role: 'guest',
    action: 'page_access',
    description: 'Guest accessed homepage',
    user_agent: 'Mozilla/5.0 Test Browser',
    session_id: 'guest-session'
  }
];

async function testActivityLogs() {
  console.log('🧪 Testing Activity Logging...\n');
  
  for (const log of sampleLogs) {
    try {
      const response = await fetch('http://localhost:3000/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.' + Math.floor(Math.random() * 255)
        },
        body: JSON.stringify(log)
      });
      
      const result = await response.json();
      console.log(`${log.user_role.toUpperCase()} log:`, 
        result.success ? '✅ SUCCESS' : '❌ FAILED', 
        '-', result.message
      );
    } catch (error) {
      console.error(`❌ Error logging ${log.user_role}:`, error.message);
    }
  }
  
  console.log('\n🔍 Fetching recent logs...');
  try {
    const response = await fetch('http://localhost:3000/api/activity-logs?page=1&limit=5');
    const result = await response.json();
    
    if (result.success) {
      console.log(`\n📊 Found ${result.data.length} recent logs:`);
      result.data.forEach(log => {
        console.log(`- ${log.user_role}: ${log.action} (${log.ip_address || 'No IP'})`);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
  }
}

testActivityLogs();
