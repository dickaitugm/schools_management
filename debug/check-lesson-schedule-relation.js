const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function checkLessonScheduleRelation() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking Lesson-Schedule Relationship ===');
    
    // Check schedules table structure for lesson relationship
    const scheduleStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      ORDER BY ordinal_position
    `;
    
    const scheduleStructure = await client.query(scheduleStructureQuery);
    console.log('Schedules table structure:');
    scheduleStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check lessons table
    const lessonsQuery = `SELECT * FROM lessons LIMIT 5`;
    const lessonsResult = await client.query(lessonsQuery);
    console.log('\nLessons data:');
    lessonsResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Title: ${row.title}, Subject: ${row.subject}`);
    });
    
    // Check schedules with potential lesson relationship
    const schedulesQuery = `
      SELECT 
        s.id,
        s.school_id,
        s.scheduled_date,
        s.status,
        s.notes,
        sch.name as school_name
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      ORDER BY s.scheduled_date DESC
      LIMIT 5
    `;
    
    const schedulesResult = await client.query(schedulesQuery);
    console.log('\nSchedules data:');
    schedulesResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, School: ${row.school_name}, Date: ${row.scheduled_date.toDateString()}, Notes: ${row.notes}`);
    });
    
    // Check if there's a lesson_id column or lesson relationship
    const relationQuery = `
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name = 'schedules' OR ccu.table_name = 'lessons')
    `;
    
    const relationResult = await client.query(relationQuery);
    console.log('\nForeign key relationships:');
    relationResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLessonScheduleRelation();
