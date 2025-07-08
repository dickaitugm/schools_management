const pool = require("../lib/db.js");

async function testDashboardAPI() {
    try {
        console.log("Testing dashboard API queries...");

        // Test basic counts
        const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM schools) as schools,
        (SELECT COUNT(*) FROM teachers) as teachers,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM lessons) as lessons,
        (SELECT COUNT(*) FROM schedules) as schedules
    `;

        const countsResult = await pool.query(countsQuery);
        console.log("✅ Basic counts:", countsResult.rows[0]);

        // Test students per school
        const studentsPerSchoolQuery = `
      SELECT 
        sch.id,
        sch.name as school_name,
        COUNT(st.id) as student_count
      FROM schools sch
      LEFT JOIN students st ON sch.id = st.school_id
      GROUP BY sch.id, sch.name
      ORDER BY student_count DESC
    `;

        const studentsResult = await pool.query(studentsPerSchoolQuery);
        console.log("✅ Students per school:", studentsResult.rows);

        // Test schedule status
        const scheduleStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM schedules
      GROUP BY status
    `;

        const statusResult = await pool.query(scheduleStatusQuery);
        console.log("✅ Schedule status:", statusResult.rows);

        // Test schedule data
        const scheduleDataQuery = `
      SELECT 
        s.id,
        s.scheduled_date,
        s.status,
        sch.name as school_name,
        sch.id as school_id,
        COUNT(sa.student_id) as student_count,
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN student_attendance sa ON s.id = sa.schedule_id
      GROUP BY s.id, sch.name, sch.id, s.scheduled_date, s.status
      ORDER BY s.scheduled_date DESC
      LIMIT 3
    `;

        const scheduleResult = await pool.query(scheduleDataQuery);
        console.log("✅ Schedule data sample:", scheduleResult.rows);

        await pool.end();
        console.log("✅ All tests passed!");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

testDashboardAPI();
