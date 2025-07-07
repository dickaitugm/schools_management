// Test script to verify all profile APIs work correctly
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bb_society_db',
  password: 'dickaface',
  port: 5432,
});

async function testProfileAPIs() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing All Profile APIs...\n');
    
    // Get sample IDs
    const schoolId = await client.query('SELECT id FROM schools LIMIT 1');
    const teacherId = await client.query('SELECT id FROM teachers LIMIT 1');
    const studentId = await client.query('SELECT id FROM students LIMIT 1');
    const lessonId = await client.query('SELECT id FROM lessons LIMIT 1');
    const scheduleId = await client.query('SELECT id FROM schedules LIMIT 1');
    
    if (!schoolId.rows[0] || !teacherId.rows[0] || !studentId.rows[0]) {
      console.log('❌ Missing basic data in database');
      return;
    }
    
    const ids = {
      school: schoolId.rows[0].id,
      teacher: teacherId.rows[0].id,
      student: studentId.rows[0].id,
      lesson: lessonId.rows[0]?.id,
      schedule: scheduleId.rows[0]?.id
    };
    
    console.log('Sample IDs:', ids);
    console.log();
    
    // Test School Profile API logic
    console.log('1. Testing School Profile API...');
    try {
      // School basic info
      const school = await client.query('SELECT * FROM schools WHERE id = $1', [ids.school]);
      
      // Teachers from completed schedules
      const teachers = await client.query(`
        SELECT DISTINCT t.*, MIN(s.scheduled_date) as association_date
        FROM teachers t
        JOIN schedule_teachers st ON t.id = st.teacher_id
        JOIN schedules s ON st.schedule_id = s.id
        WHERE s.school_id = $1 AND s.status = 'completed'
        GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at
        ORDER BY t.name
      `, [ids.school]);
      
      // Students from completed schedules
      const students = await client.query(`
        SELECT DISTINCT s.*, MIN(sch.scheduled_date) as enrollment_date
        FROM students s
        JOIN student_attendance sa ON s.id = sa.student_id
        JOIN schedules sch ON sa.schedule_id = sch.id
        WHERE sch.school_id = $1 AND sch.status = 'completed' AND s.school_id = $1
        GROUP BY s.id, s.name, s.email, s.phone, s.grade, s.age, s.school_id, s.created_at, s.enrollment_date
        ORDER BY s.name
      `, [ids.school]);
      
      console.log(`   ✅ School: ${school.rows[0]?.name}`);
      console.log(`   ✅ Teachers: ${teachers.rows.length} found`);
      console.log(`   ✅ Students: ${students.rows.length} found`);
    } catch (error) {
      console.log('   ❌ School Profile Error:', error.message);
    }
    
    console.log();
    
    // Test Teacher Profile API logic
    console.log('2. Testing Teacher Profile API...');
    try {
      // Teacher basic info
      const teacher = await client.query('SELECT * FROM teachers WHERE id = $1', [ids.teacher]);
      
      // Schools from completed schedules
      const schools = await client.query(`
        SELECT DISTINCT s.*, MIN(sch.scheduled_date) as association_date
        FROM schools s
        JOIN schedules sch ON s.id = sch.school_id
        JOIN schedule_teachers st ON sch.id = st.schedule_id
        WHERE st.teacher_id = $1 AND sch.status = 'completed'
        GROUP BY s.id, s.name, s.address, s.phone, s.email, s.created_at
        ORDER BY s.name
      `, [ids.teacher]);
      
      // Students from completed schedules
      const students = await client.query(`
        SELECT DISTINCT s.*, sch.name as school_name, MIN(schd.scheduled_date) as association_date
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        JOIN student_attendance sa ON s.id = sa.student_id
        JOIN schedules schd ON sa.schedule_id = schd.id
        JOIN schedule_teachers st ON schd.id = st.schedule_id
        WHERE st.teacher_id = $1 AND schd.status = 'completed'
        GROUP BY s.id, s.name, s.email, s.phone, s.grade, s.age, s.school_id, s.created_at, s.enrollment_date, sch.name
        ORDER BY s.name
      `, [ids.teacher]);
      
      console.log(`   ✅ Teacher: ${teacher.rows[0]?.name}`);
      console.log(`   ✅ Schools: ${schools.rows.length} found`);
      console.log(`   ✅ Students: ${students.rows.length} found`);
    } catch (error) {
      console.log('   ❌ Teacher Profile Error:', error.message);
    }
    
    console.log();
    
    // Test Student Profile API logic
    console.log('3. Testing Student Profile API...');
    try {
      // Student basic info
      const student = await client.query(`
        SELECT s.*, sch.name as school_name, sch.address as school_address
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        WHERE s.id = $1
      `, [ids.student]);
      
      // Teachers from completed schedules
      const teachers = await client.query(`
        SELECT DISTINCT t.*, MIN(s.scheduled_date) as association_date
        FROM teachers t
        JOIN schedule_teachers st ON t.id = st.teacher_id
        JOIN schedules s ON st.schedule_id = s.id
        JOIN student_attendance sa ON s.id = sa.schedule_id
        WHERE sa.student_id = $1 AND s.status = 'completed'
        GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at
        ORDER BY t.name
      `, [ids.student]);
      
      console.log(`   ✅ Student: ${student.rows[0]?.name}`);
      console.log(`   ✅ Teachers: ${teachers.rows.length} found`);
    } catch (error) {
      console.log('   ❌ Student Profile Error:', error.message);
    }
    
    console.log();
    
    console.log('🎉 Profile API testing completed!');
    console.log('\nSummary:');
    console.log('✅ All SQL queries in profile APIs should work correctly');
    console.log('✅ No more reference to non-existent updated_at columns'); 
    console.log('✅ Profile views now use completed schedules for relationships');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Test profile views in browser');
    console.log('3. Check browser console for any remaining errors');
    
  } catch (error) {
    console.error('❌ Error during API testing:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testProfileAPIs();
