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
        result.rows.forEach((row) => {
            console.log(`- Schedule ID: ${row.schedule_id} | School: ${row.school_name}`);
            console.log(
                `  Date: ${new Date(row.scheduled_date).toLocaleDateString()} | Status: ${
                    row.status
                }`
            );
            console.log(
                `  Attendance Records: ${row.total_attendance_records} | Properly Assessed: ${row.properly_assessed_students} | Total Students: ${row.total_school_students}`
            );
            console.log("");
        });

        // Check specific attendance records to see what's happening
        console.log("🔍 Sample attendance records:");
        const attendanceDetails = await pool.query(`
      SELECT 
        sa.schedule_id,
        s.name as student_name,
        sa.attendance_status,
        sa.personal_development_level,
        sa.critical_thinking_level,
        sa.team_work_level,
        sa.academic_knowledge_level
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      ORDER BY sa.schedule_id, s.name
      LIMIT 5
    `);

        attendanceDetails.rows.forEach((row) => {
            const isAssessed =
                row.attendance_status === "present" &&
                row.personal_development_level !== null &&
                row.critical_thinking_level !== null &&
                row.team_work_level !== null &&
                row.academic_knowledge_level !== null;

            console.log(
                `- Schedule ${row.schedule_id} | ${row.student_name} | Status: ${row.attendance_status}`
            );
            console.log(
                `  Assessment levels: PD:${row.personal_development_level} CT:${row.critical_thinking_level} TW:${row.team_work_level} AK:${row.academic_knowledge_level}`
            );
            console.log(`  ${isAssessed ? "✅ PROPERLY ASSESSED" : "❌ NOT PROPERLY ASSESSED"}`);
            console.log("");
        });

        await pool.end();
        console.log("✅ Assessment logic test completed!");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

testAssessedStudentsLogic();
