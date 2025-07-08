const pool = require("../lib/db.js");

async function testAssessedStudentsLogic() {
    try {
        console.log("🔍 Testing updated assessed students logic...\n");

        // Test new query for assessed students
        const assessedStudentsQuery = `
      SELECT 
        s.id as schedule_id,
        sch.name as school_name,
        s.scheduled_date,
        s.status,
        -- Count all students in attendance table
        (SELECT COUNT(*) FROM student_attendance sa WHERE sa.schedule_id = s.id) as total_attendance_records,
        -- Count properly assessed students (Present AND all assessment categories filled)
        (SELECT COUNT(*) 
         FROM student_attendance sa 
         WHERE sa.schedule_id = s.id 
         AND sa.attendance_status = 'present'
         AND sa.personal_development_level IS NOT NULL 
         AND sa.critical_thinking_level IS NOT NULL 
         AND sa.team_work_level IS NOT NULL 
         AND sa.academic_knowledge_level IS NOT NULL
        ) as properly_assessed_students,
        -- Count total students in school
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      ORDER BY s.scheduled_date DESC
      LIMIT 5
    `;

        const result = await pool.query(assessedStudentsQuery);

        console.log("📊 Schedule Assessment Analysis:");
        console.table(
            result.rows.map((row) => ({
                "Schedule ID": row.schedule_id,
                School: row.school_name,
                Date: new Date(row.scheduled_date).toLocaleDateString(),
                Status: row.status,
                "Attendance Records": row.total_attendance_records,
                "Properly Assessed": row.properly_assessed_students,
                "Total Students": row.total_school_students,
            }))
        );

        // Check specific attendance records
        console.log("\n🔍 Detailed attendance records for analysis:");
        const attendanceDetails = await pool.query(`
      SELECT 
        sa.schedule_id,
        sa.student_id,
        s.name as student_name,
        sa.attendance_status,
        CASE 
          WHEN sa.personal_development_level IS NOT NULL THEN '✓' 
          ELSE '✗' 
        END as personal_dev,
        CASE 
          WHEN sa.critical_thinking_level IS NOT NULL THEN '✓' 
          ELSE '✗' 
        END as critical_thinking,
        CASE 
          WHEN sa.team_work_level IS NOT NULL THEN '✓' 
          ELSE '✗' 
        END as team_work,
        CASE 
          WHEN sa.academic_knowledge_level IS NOT NULL THEN '✓' 
          ELSE '✗' 
        END as academic_knowledge,
        CASE 
          WHEN sa.attendance_status = 'present' 
          AND sa.personal_development_level IS NOT NULL 
          AND sa.critical_thinking_level IS NOT NULL 
          AND sa.team_work_level IS NOT NULL 
          AND sa.academic_knowledge_level IS NOT NULL 
          THEN '✅ ASSESSED' 
          ELSE '❌ NOT ASSESSED' 
        END as assessment_status
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      ORDER BY sa.schedule_id, s.name
      LIMIT 10
    `);

        console.table(attendanceDetails.rows);

        await pool.end();
        console.log("\n✅ Assessment logic test completed!");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

testAssessedStudentsLogic();
