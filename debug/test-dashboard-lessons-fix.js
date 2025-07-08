const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function testDashboardStatsWithLessons() {
  const client = await pool.connect();
  
  try {
    console.log('=== Testing Updated Dashboard Stats API ===');
    
    // Test the counts query
    const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM teachers) as total_teachers,
        (SELECT COUNT(*) FROM schools) as total_schools,
        (SELECT COUNT(*) FROM lessons) as total_lessons,
        (SELECT COUNT(*) FROM schedules) as total_schedules,
        (SELECT COUNT(*) FROM schedules WHERE scheduled_date = CURRENT_DATE) as today_schedules
    `;
    
    const countsResult = await client.query(countsQuery);
    console.log('Counts:');
    console.log(`  📚 Total Lessons: ${countsResult.rows[0].total_lessons}`);
    console.log(`  📅 Total Schedules: ${countsResult.rows[0].total_schedules}`);
    console.log(`  📅 Today Schedules: ${countsResult.rows[0].today_schedules}`);
    console.log(`  👥 Total Students: ${countsResult.rows[0].total_students}`);
    console.log(`  👨‍🏫 Total Teachers: ${countsResult.rows[0].total_teachers}`);
    console.log(`  🏫 Total Schools: ${countsResult.rows[0].total_schools}`);
    
    // Test the recent schedules query with lesson activity
    const recentSchedulesQuery = `
      SELECT 
        s.id,
        s.scheduled_date,
        s.scheduled_time,
        s.status,
        s.notes,
        sch.name as school_name,
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students,
        COALESCE(
          (SELECT STRING_AGG(l.title, ', ' ORDER BY l.title) 
           FROM schedule_lessons sl 
           JOIN lessons l ON sl.lesson_id = l.id 
           WHERE sl.schedule_id = s.id),
          COALESCE(NULLIF(s.notes, ''), 'General Learning Activity')
        ) as lesson_activity,
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
    
    const recentResult = await client.query(recentSchedulesQuery);
    console.log('\\nRecent Schedules with Lesson Activity:');
    recentResult.rows.forEach(row => {
      console.log(`\\n  📋 Schedule: ${row.school_name}`);
      console.log(`  📅 Date: ${row.scheduled_date.toDateString()}`);
      console.log(`  📚 Lesson Activity: ${row.lesson_activity}`);
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

testDashboardStatsWithLessons();
