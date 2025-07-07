// debug/test-assessment-data.js
// Script untuk test data assessment di database

const pool = require('../lib/db').default;

async function testAssessmentData() {
  try {
    console.log('🔍 Testing assessment data in database...');
    
    const client = await pool.connect();
    
    // Get all schedules
    const schedulesResult = await client.query('SELECT id, lesson_title, lesson_date, status FROM schedules ORDER BY lesson_date DESC LIMIT 5');
    console.log('\n📅 Recent schedules:');
    schedulesResult.rows.forEach(schedule => {
      console.log(`  - ID: ${schedule.id}, Title: ${schedule.lesson_title}, Date: ${schedule.lesson_date}, Status: ${schedule.status}`);
    });
    
    // Get student_attendance data
    const attendanceResult = await client.query('SELECT * FROM student_attendance ORDER BY updated_at DESC LIMIT 10');
    console.log('\n📊 Recent student attendance/assessments:');
    attendanceResult.rows.forEach(attendance => {
      console.log(`  - Schedule ID: ${attendance.schedule_id}, Student ID: ${attendance.student_id}`);
      console.log(`    Attendance: ${attendance.attendance_status}`);
      console.log(`    Personal Dev: ${attendance.personal_development_level}, Critical: ${attendance.critical_thinking_level}`);
      console.log(`    Team Work: ${attendance.team_work_level}, Academic: ${attendance.academic_knowledge_level}`);
      console.log(`    Knowledge: ${attendance.knowledge_score}, Participation: ${attendance.participation_score}`);
      console.log(`    Notes: ${attendance.notes || 'No notes'}`);
      console.log(`    Updated: ${attendance.updated_at}`);
      console.log('    ---');
    });
    
    // Test specific schedule assessment query (example with schedule ID 1)
    if (schedulesResult.rows.length > 0) {
      const testScheduleId = schedulesResult.rows[0].id;
      console.log(`\n🧪 Testing assessment query for schedule ID: ${testScheduleId}`);
      
      const testQuery = `
        SELECT 
          s.id,
          s.name,
          s.grade,
          s.age,
          sa.id as attendance_id,
          sa.attendance_status,
          sa.knowledge_score,
          sa.participation_score,
          sa.personal_development_level,
          sa.critical_thinking_level,
          sa.team_work_level,
          sa.academic_knowledge_level,
          sa.notes as assessment_notes,
          sa.updated_at as last_assessed
        FROM students s
        LEFT JOIN student_attendance sa ON s.id = sa.student_id AND sa.schedule_id = $1
        WHERE s.school_id = (SELECT school_id FROM schedules WHERE id = $1)
        ORDER BY s.name
      `;
      
      const testResult = await client.query(testQuery, [testScheduleId]);
      console.log(`Found ${testResult.rows.length} students for schedule ${testScheduleId}:`);
      testResult.rows.forEach(student => {
        console.log(`  - ${student.name} (ID: ${student.id})`);
        if (student.attendance_id) {
          console.log(`    Has assessment data: Attendance=${student.attendance_status}, PD=${student.personal_development_level}`);
        } else {
          console.log(`    No assessment data yet`);
        }
      });
    }
    
    client.release();
    console.log('\n✅ Assessment data test completed');
    
  } catch (error) {
    console.error('❌ Error testing assessment data:', error);
  }
}

testAssessmentData();
