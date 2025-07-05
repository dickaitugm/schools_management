const pool = require('../lib/db');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test teachers table
    const teachersResult = await client.query('SELECT COUNT(*) as count FROM teachers');
    console.log(`📊 Teachers table: ${teachersResult.rows[0].count} records`);
    
    // Test lessons table
    const lessonsResult = await client.query('SELECT COUNT(*) as count FROM lessons');
    console.log(`📚 Lessons table: ${lessonsResult.rows[0].count} records`);
    
    // Test schools table
    const schoolsResult = await client.query('SELECT COUNT(*) as count FROM schools');
    console.log(`🏫 Schools table: ${schoolsResult.rows[0].count} records`);
    
    client.release();
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run test if script is called directly
if (require.main === module) {
  testDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = testDatabase;
