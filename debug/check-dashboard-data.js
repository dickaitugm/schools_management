const pool = require('../lib/db.js');

async function checkData() {
  const client = await pool.connect();
  try {
    console.log('=== SCHEDULES DATA ===');
    const schedules = await client.query('SELECT * FROM schedules ORDER BY scheduled_date DESC LIMIT 10');
    console.log('Schedules count:', schedules.rows.length);
    schedules.rows.forEach(row => {
      console.log('- Schedule ID:', row.id, '| School ID:', row.school_id, '| Date:', row.scheduled_date, '| Status:', row.status);
    });
    
    console.log('\n=== STUDENTS PER SCHEDULE ===');
    const studentsPerSchedule = await client.query(`
      SELECT 
        s.id as schedule_id,
        sch.name as school_name,
        s.scheduled_date,
        s.status,
        COUNT(sa.student_id) as student_count
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN student_attendance sa ON s.id = sa.schedule_id
      GROUP BY s.id, sch.name, s.scheduled_date, s.status
      ORDER BY s.scheduled_date DESC
      LIMIT 10
    `);
    
    studentsPerSchedule.rows.forEach(row => {
      console.log('- Schedule:', row.schedule_id, '| School:', row.school_name, '| Date:', row.scheduled_date, '| Students:', row.student_count);
    });

    console.log('\n=== TOTAL COUNTS ===');
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM schedules) as total_schedules,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM schools) as total_schools,
        (SELECT COUNT(*) FROM teachers) as total_teachers,
        (SELECT COUNT(*) FROM lessons) as total_lessons
    `);
    console.log('Total counts:', counts.rows[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();
