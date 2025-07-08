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

async function checkStudentData() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking Student Data and Attendance ===');
    
    // Check students per school
    const studentsPerSchoolQuery = `
      SELECT 
        s.id as school_id,
        s.name as school_name,
        COUNT(st.id) as total_students
      FROM schools s
      LEFT JOIN students st ON s.id = st.school_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `;
    
    const studentsResult = await client.query(studentsPerSchoolQuery);
    console.log('Students per school:');
    studentsResult.rows.forEach(row => {
      console.log(`  - ${row.school_name}: ${row.total_students} students`);
    });
    
    // Check recent schedules with detailed attendance
    const detailedSchedulesQuery = `
      SELECT 
        s.id,
        s.scheduled_date,
        s.scheduled_time,
        s.status,
        s.notes,
        sch.name as school_name,
        sch.id as school_id,
        -- Total students in school
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students,
        -- Students with attendance record
        COUNT(DISTINCT sa.student_id) as students_with_attendance,
        -- Present students
        COUNT(DISTINCT CASE WHEN sa.attendance_status = 'present' THEN sa.student_id END) as present_students,
        -- Assessed students (present + all assessments filled)
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
      GROUP BY s.id, s.scheduled_date, s.scheduled_time, s.status, s.notes, sch.name, sch.id
      ORDER BY s.scheduled_date DESC
      LIMIT 5
    `;
    
    const detailedResult = await client.query(detailedSchedulesQuery);
    console.log('\\nDetailed schedule data:');
    detailedResult.rows.forEach(row => {
      console.log(`\\n  Schedule ID: ${row.id}`);
      console.log(`  School: ${row.school_name}`);
      console.log(`  Date: ${row.scheduled_date.toDateString()}`);
      console.log(`  Time: ${row.scheduled_time}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Notes: ${row.notes}`);
      console.log(`  Total Students in School: ${row.total_school_students}`);
      console.log(`  Students with Attendance: ${row.students_with_attendance}`);
      console.log(`  Present Students: ${row.present_students}`);
      console.log(`  Assessed Students: ${row.assessed_students}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStudentData();
