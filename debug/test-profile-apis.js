// Test script untuk debug error 500 pada profile APIs
// Script ini akan menguji setiap API profile secara langsung

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
    console.log('🔍 Testing Profile APIs for Error 500...\n');
    
    // Test 1: School Profile API
    console.log('1. Testing School Profile API...');
    try {
      const schoolResult = await client.query('SELECT * FROM schools WHERE id = $1', [1]);
      if (schoolResult.rows.length === 0) {
        console.log('   ❌ School ID 1 not found');
      } else {
        console.log('   ✅ School found:', schoolResult.rows[0].name);
        
        // Test teachers query
        const teachersResult = await client.query(`
          SELECT DISTINCT t.*, MIN(s.scheduled_date) as association_date
          FROM teachers t
          JOIN schedule_teachers st ON t.id = st.teacher_id
          JOIN schedules s ON st.schedule_id = s.id
          WHERE s.school_id = $1 AND s.status = 'completed'
          GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at, t.updated_at
          ORDER BY t.name
        `, [1]);
        console.log('   ✅ Teachers query:', teachersResult.rows.length, 'rows');
        
        // Test students query
        const studentsResult = await client.query(`
          SELECT DISTINCT s.*, MIN(sch.scheduled_date) as enrollment_date
          FROM students s
          JOIN student_attendance sa ON s.id = sa.student_id
          JOIN schedules sch ON sa.schedule_id = sch.id
          WHERE sch.school_id = $1 AND sch.status = 'completed' AND s.school_id = $1
          GROUP BY s.id, s.name, s.email, s.phone, s.grade, s.age, s.school_id, s.created_at, s.updated_at
          ORDER BY s.name
        `, [1]);
        console.log('   ✅ Students query:', studentsResult.rows.length, 'rows');
        
        // Test statistics
        const statsResult = await client.query(`
          SELECT 
            (SELECT COUNT(DISTINCT s.id) FROM students s
             JOIN student_attendance sa ON s.id = sa.student_id
             JOIN schedules sch ON sa.schedule_id = sch.id
             WHERE sch.school_id = $1 AND sch.status = 'completed' AND s.school_id = $1) as total_students,
            (SELECT COUNT(DISTINCT t.id) FROM teachers t
             JOIN schedule_teachers st ON t.id = st.teacher_id
             JOIN schedules s ON st.schedule_id = s.id
             WHERE s.school_id = $1 AND s.status = 'completed') as total_teachers,
            (SELECT COUNT(DISTINCT l.id) FROM lessons l 
             JOIN schedule_lessons sl ON l.id = sl.lesson_id 
             JOIN schedules s ON sl.schedule_id = s.id 
             WHERE s.school_id = $1) as total_lessons,
            (SELECT COUNT(*) FROM schedules WHERE school_id = $1) as total_schedules,
            (SELECT COUNT(*) FROM schedules WHERE school_id = $1 AND scheduled_date >= CURRENT_DATE) as upcoming_schedules
        `, [1]);
        console.log('   ✅ Statistics query successful');
      }
    } catch (error) {
      console.log('   ❌ School Profile API Error:', error.message);
    }
    
    console.log();
    
    // Test 2: Teacher Profile API
    console.log('2. Testing Teacher Profile API...');
    try {
      const teacherResult = await client.query('SELECT * FROM teachers WHERE id = $1', [1]);
      if (teacherResult.rows.length === 0) {
        console.log('   ❌ Teacher ID 1 not found');
      } else {
        console.log('   ✅ Teacher found:', teacherResult.rows[0].name);
        
        // Test schools query
        const schoolsResult = await client.query(`
          SELECT DISTINCT s.*, MIN(sch.scheduled_date) as association_date
          FROM schools s
          JOIN schedules sch ON s.id = sch.school_id
          JOIN schedule_teachers st ON sch.id = st.schedule_id
          WHERE st.teacher_id = $1 AND sch.status = 'completed'
          GROUP BY s.id, s.name, s.address, s.phone, s.email, s.created_at, s.updated_at
          ORDER BY s.name
        `, [1]);
        console.log('   ✅ Schools query:', schoolsResult.rows.length, 'rows');
        
        // Test students query
        const studentsResult = await client.query(`
          SELECT DISTINCT s.*, sch.name as school_name, MIN(schd.scheduled_date) as association_date
          FROM students s
          JOIN schools sch ON s.school_id = sch.id
          JOIN student_attendance sa ON s.id = sa.student_id
          JOIN schedules schd ON sa.schedule_id = schd.id
          JOIN schedule_teachers st ON schd.id = st.schedule_id
          WHERE st.teacher_id = $1 AND schd.status = 'completed'
          GROUP BY s.id, s.name, s.email, s.phone, s.grade, s.age, s.school_id, s.created_at, s.updated_at, sch.name
          ORDER BY s.name
        `, [1]);
        console.log('   ✅ Students query:', studentsResult.rows.length, 'rows');
        
        // Test statistics
        const statsResult = await client.query(`
          SELECT 
            (SELECT COUNT(DISTINCT s.id) FROM schools s
             JOIN schedules sch ON s.id = sch.school_id
             JOIN schedule_teachers st ON sch.id = st.schedule_id
             WHERE st.teacher_id = $1 AND sch.status = 'completed') as total_schools,
            (SELECT COUNT(DISTINCT s.id) FROM students s
             JOIN student_attendance sa ON s.id = sa.student_id
             JOIN schedules schd ON sa.schedule_id = schd.id
             JOIN schedule_teachers st ON schd.id = st.schedule_id
             WHERE st.teacher_id = $1 AND schd.status = 'completed') as total_students,
            (SELECT COUNT(*) FROM lesson_teachers WHERE teacher_id = $1) as total_lessons,
            (SELECT COUNT(*) FROM schedule_teachers st 
             JOIN schedules s ON st.schedule_id = s.id 
             WHERE st.teacher_id = $1) as total_schedules,
            (SELECT COUNT(*) FROM schedule_teachers st 
             JOIN schedules s ON st.schedule_id = s.id 
             WHERE st.teacher_id = $1 AND s.scheduled_date >= CURRENT_DATE) as upcoming_schedules
        `, [1]);
        console.log('   ✅ Statistics query successful');
      }
    } catch (error) {
      console.log('   ❌ Teacher Profile API Error:', error.message);
    }
    
    console.log();
    
    // Test 3: Student Profile API
    console.log('3. Testing Student Profile API...');
    try {
      const studentResult = await client.query(`
        SELECT s.*, sch.name as school_name, sch.address as school_address
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        WHERE s.id = $1
      `, [1]);
      
      if (studentResult.rows.length === 0) {
        console.log('   ❌ Student ID 1 not found');
      } else {
        console.log('   ✅ Student found:', studentResult.rows[0].name);
        const student = studentResult.rows[0];
        
        // Test teachers query
        const teachersResult = await client.query(`
          SELECT DISTINCT t.*, MIN(s.scheduled_date) as association_date
          FROM teachers t
          JOIN schedule_teachers st ON t.id = st.teacher_id
          JOIN schedules s ON st.schedule_id = s.id
          JOIN student_attendance sa ON s.id = sa.schedule_id
          WHERE sa.student_id = $1 AND s.status = 'completed'
          GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at, t.updated_at
          ORDER BY t.name
        `, [1]);
        console.log('   ✅ Teachers query:', teachersResult.rows.length, 'rows');
        
        // Test statistics
        const statsResult = await client.query(`
          SELECT 
            (SELECT COUNT(DISTINCT t.id) FROM teachers t
             JOIN schedule_teachers st ON t.id = st.teacher_id
             JOIN schedules s ON st.schedule_id = s.id
             JOIN student_attendance sa ON s.id = sa.schedule_id
             WHERE sa.student_id = $1 AND s.status = 'completed') as total_teachers,
            (SELECT COUNT(*) FROM student_attendance WHERE student_id = $1) as total_attendances,
            (SELECT COUNT(*) FROM student_attendance WHERE student_id = $1 AND attendance_status = 'present') as present_count,
            (SELECT COUNT(*) FROM student_attendance WHERE student_id = $1 AND attendance_status = 'absent') as absent_count,
            (SELECT ROUND(AVG(knowledge_score), 2) FROM student_attendance WHERE student_id = $1 AND knowledge_score IS NOT NULL) as avg_knowledge_score
        `, [1, student.school_id]);
        console.log('   ✅ Statistics query successful');
      }
    } catch (error) {
      console.log('   ❌ Student Profile API Error:', error.message);
    }
    
    console.log();
    
    // Test 4: Check for missing tables/columns
    console.log('4. Checking database structure...');
    try {
      const tables = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log('   ✅ Available tables:', tables.rows.map(r => r.table_name).join(', '));
      
      // Check if old relation tables still exist
      const oldTables = ['teacher_schools', 'student_teachers'];
      for (const table of oldTables) {
        const exists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);
        
        if (exists.rows[0].exists) {
          const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`   ⚠️  Old table ${table} still exists with ${count.rows[0].count} records`);
        } else {
          console.log(`   ✅ Old table ${table} removed`);
        }
      }
    } catch (error) {
      console.log('   ❌ Database structure check error:', error.message);
    }
    
    console.log('\n🎉 Profile API testing completed!');
    
  } catch (error) {
    console.error('❌ General testing error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testProfileAPIs();
