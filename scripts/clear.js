const pool = require('../lib/db');

async function clearDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ Clearing database...');

    // Drop all tables in correct order (considering foreign key constraints)
    await client.query('DROP TABLE IF EXISTS student_attendance CASCADE');
    await client.query('DROP TABLE IF EXISTS schedule_lessons CASCADE');
    await client.query('DROP TABLE IF EXISTS schedule_teachers CASCADE');
    await client.query('DROP TABLE IF EXISTS schedules CASCADE');
    await client.query('DROP TABLE IF EXISTS teacher_schools CASCADE');
    await client.query('DROP TABLE IF EXISTS lessons CASCADE');
    await client.query('DROP TABLE IF EXISTS students CASCADE');
    await client.query('DROP TABLE IF EXISTS teachers CASCADE');
    await client.query('DROP TABLE IF EXISTS schools CASCADE');

    console.log('✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run clearing if script is called directly
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('🎉 Database clearing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Clearing failed:', error);
      process.exit(1);
    });
}

module.exports = clearDatabase;
