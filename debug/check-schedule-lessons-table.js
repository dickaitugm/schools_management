const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function checkScheduleLessonsTable() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking Schedule-Lessons Relationship ===');
    
    // Check schedule_lessons table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'schedule_lessons' 
      ORDER BY ordinal_position
    `;
    
    const structure = await client.query(structureQuery);
    console.log('Schedule_lessons table structure:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check schedule_lessons data
    const dataQuery = `
      SELECT * FROM schedule_lessons ORDER BY schedule_id DESC LIMIT 10
    `;
    
    const dataResult = await client.query(dataQuery);
    console.log('\nSchedule_lessons data:');
    dataResult.rows.forEach(row => {
      console.log(`  - Schedule ID: ${row.schedule_id}, Lesson ID: ${row.lesson_id}`);
    });
    
    // Check schedules with their lessons
    const schedulesWithLessonsQuery = `
      SELECT 
        s.id as schedule_id,
        s.scheduled_date,
        s.status,
        s.notes,
        sch.name as school_name,
        l.id as lesson_id,
        l.title as lesson_title,
        l.subject as lesson_subject
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      ORDER BY s.scheduled_date DESC
      LIMIT 10
    `;
    
    const schedulesResult = await client.query(schedulesWithLessonsQuery);
    console.log('\nSchedules with lessons:');
    schedulesResult.rows.forEach(row => {
      console.log(`\\n  📋 Schedule ${row.schedule_id}: ${row.school_name}`);
      console.log(`  📅 Date: ${row.scheduled_date.toDateString()}`);
      console.log(`  📚 Lesson: ${row.lesson_title || 'No lesson assigned'}`);
      console.log(`  📝 Notes: ${row.notes || 'No notes'}`);
      console.log(`  📊 Status: ${row.status}`);
    });
    
    // Count total lessons and schedules
    const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM lessons) as total_lessons,
        (SELECT COUNT(*) FROM schedules) as total_schedules,
        (SELECT COUNT(*) FROM schedule_lessons) as schedule_lesson_connections
    `;
    
    const countsResult = await client.query(countsQuery);
    console.log('\\nCounts:');
    console.log(`  📚 Total Lessons: ${countsResult.rows[0].total_lessons}`);
    console.log(`  📅 Total Schedules: ${countsResult.rows[0].total_schedules}`);
    console.log(`  🔗 Schedule-Lesson Connections: ${countsResult.rows[0].schedule_lesson_connections}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkScheduleLessonsTable();
