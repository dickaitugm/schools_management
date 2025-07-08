const { Pool } = require('pg');
require('dotenv').config();

// Use the same connection logic as the main app
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function testDashboardStatsAPI() {
  const client = await pool.connect();
  
  try {
    console.log('=== Testing Dashboard Stats API Query ===');
    
    // Test the exact query from the API
    const recentSchedulesQuery = `
      SELECT 
        s.id,
        s.scheduled_date,
        s.scheduled_time,
        s.status,
        COALESCE(NULLIF(s.notes, ''), 'General Learning Activity') as notes,
        sch.name as school_name,
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students,
        COUNT(DISTINCT CASE 
          WHEN sa.attendance_status = 'present' 
          AND sa.personal_development_level IS NOT NULL 
          AND sa.critical_thinking_level IS NOT NULL 
          AND sa.team_work_level IS NOT NULL 
          AND sa.academic_knowledge_level IS NOT NULL 
          THEN sa.student_id END) as assessed_students
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN student_attendance sa ON s.id = sa.schedule_id
      WHERE s.scheduled_date <= CURRENT_DATE
      GROUP BY s.id, s.scheduled_date, s.scheduled_time, s.status, s.notes, sch.name, s.school_id
      ORDER BY s.scheduled_date DESC, s.scheduled_time DESC
      LIMIT 3
    `;
    
    const result = await client.query(recentSchedulesQuery);
    console.log('Recent Schedules API data:');
    result.rows.forEach(row => {
      console.log(`\\n  📋 Schedule: ${row.school_name}`);
      console.log(`  📅 Date: ${row.scheduled_date.toDateString()}`);
      console.log(`  ⏰ Time: ${row.scheduled_time}`);
      console.log(`  📚 Lesson: ${row.notes}`);
      console.log(`  👥 Students: ${row.assessed_students}/${row.total_school_students} assessed`);
      console.log(`  📊 Status: ${row.status}`);
    });
    
    // Test upcoming schedules as well
    const upcomingSchedulesQuery = `
      SELECT 
        s.id,
        s.scheduled_date,
        s.scheduled_time,
        s.status,
        COALESCE(NULLIF(s.notes, ''), 'General Learning Activity') as notes,
        sch.name as school_name,
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students,
        COUNT(DISTINCT CASE 
          WHEN sa.attendance_status = 'present' 
          AND sa.personal_development_level IS NOT NULL 
          AND sa.critical_thinking_level IS NOT NULL 
          AND sa.team_work_level IS NOT NULL 
          AND sa.academic_knowledge_level IS NOT NULL 
          THEN sa.student_id END) as assessed_students
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN student_attendance sa ON s.id = sa.schedule_id
      WHERE s.scheduled_date > CURRENT_DATE
      GROUP BY s.id, s.scheduled_date, s.scheduled_time, s.status, s.notes, sch.name, s.school_id
      ORDER BY s.scheduled_date ASC, s.scheduled_time ASC
      LIMIT 3
    `;
    
    const upcomingResult = await client.query(upcomingSchedulesQuery);
    console.log('\\n\\nUpcoming Schedules API data:');
    upcomingResult.rows.forEach(row => {
      console.log(`\\n  📋 Schedule: ${row.school_name}`);
      console.log(`  📅 Date: ${row.scheduled_date.toDateString()}`);
      console.log(`  ⏰ Time: ${row.scheduled_time}`);
      console.log(`  📚 Lesson: ${row.notes}`);
      console.log(`  👥 Students: ${row.assessed_students}/${row.total_school_students} assessed`);
      console.log(`  📊 Status: ${row.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDashboardStatsAPI();
