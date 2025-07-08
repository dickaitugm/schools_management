import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET() {
    const client = await pool.connect();
    try {
        // Get current date and time from database
        const currentTimeQuery = await client.query('SELECT NOW() as current_time');
        const currentTime = currentTimeQuery.rows[0].current_time;

        // Get total counts
        const countsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(*) FROM teachers) as total_teachers,
                (SELECT COUNT(*) FROM schools) as total_schools,
                (SELECT COUNT(*) FROM lessons) as total_lessons,
                (SELECT COUNT(*) FROM schedules) as total_schedules,
                (SELECT COUNT(*) FROM schedules WHERE scheduled_date = CURRENT_DATE) as today_schedules
        `;

        const countsResult = await client.query(countsQuery);

        // Get recent schedules (3 most recent with data)
        const recentSchedulesQuery = `
            SELECT 
                s.id,
                s.scheduled_date,
                s.scheduled_time,
                s.status,
                s.notes,
                sch.name as school_name,
                (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students,
                -- Get lesson titles for this schedule
                COALESCE(
                    (SELECT STRING_AGG(l.title, ', ' ORDER BY l.title) 
                     FROM schedule_lessons sl 
                     JOIN lessons l ON sl.lesson_id = l.id 
                     WHERE sl.schedule_id = s.id),
                    COALESCE(NULLIF(s.notes, ''), 'General Learning Activity')
                ) as lesson_activity,
                COUNT(DISTINCT CASE 
                    WHEN sa.attendance_status = 'present' 
                    AND sa.personal_development_level IS NOT NULL 
                    AND sa.critical_thinking_level IS NOT NULL 
                    AND sa.team_work_level IS NOT NULL 
                    AND sa.academic_knowledge_level IS NOT NULL 
                    THEN sa.student_id END) as assessed_students,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.personal_development_level IS NOT NULL THEN CAST(sa.personal_development_level AS DECIMAL) END) as avg_personal,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.critical_thinking_level IS NOT NULL THEN CAST(sa.critical_thinking_level AS DECIMAL) END) as avg_critical,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.team_work_level IS NOT NULL THEN CAST(sa.team_work_level AS DECIMAL) END) as avg_teamwork,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.academic_knowledge_level IS NOT NULL THEN CAST(sa.academic_knowledge_level AS DECIMAL) END) as avg_academic,
                AVG(CASE WHEN sa.attendance_status = 'present' 
                    AND sa.personal_development_level IS NOT NULL 
                    AND sa.critical_thinking_level IS NOT NULL 
                    AND sa.team_work_level IS NOT NULL 
                    AND sa.academic_knowledge_level IS NOT NULL 
                    THEN (CAST(sa.personal_development_level AS DECIMAL) + CAST(sa.critical_thinking_level AS DECIMAL) + CAST(sa.team_work_level AS DECIMAL) + CAST(sa.academic_knowledge_level AS DECIMAL)) / 4.0 
                END) as avg_overall
            FROM schedules s
            LEFT JOIN schools sch ON s.school_id = sch.id
            LEFT JOIN student_attendance sa ON s.id = sa.schedule_id
            WHERE s.scheduled_date <= CURRENT_DATE
            GROUP BY s.id, s.scheduled_date, s.scheduled_time, s.status, s.notes, sch.name, s.school_id
            ORDER BY s.scheduled_date DESC, s.scheduled_time DESC
            LIMIT 3
        `;

        const recentSchedulesResult = await client.query(recentSchedulesQuery);

        // Get upcoming schedules (3 most upcoming with data)
        const upcomingSchedulesQuery = `
            SELECT 
                s.id,
                s.scheduled_date,
                s.scheduled_time,
                s.status,
                s.notes,
                sch.name as school_name,
                (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students,
                -- Get lesson titles for this schedule
                COALESCE(
                    (SELECT STRING_AGG(l.title, ', ' ORDER BY l.title) 
                     FROM schedule_lessons sl 
                     JOIN lessons l ON sl.lesson_id = l.id 
                     WHERE sl.schedule_id = s.id),
                    COALESCE(NULLIF(s.notes, ''), 'General Learning Activity')
                ) as lesson_activity,
                COUNT(DISTINCT CASE 
                    WHEN sa.attendance_status = 'present' 
                    AND sa.personal_development_level IS NOT NULL 
                    AND sa.critical_thinking_level IS NOT NULL 
                    AND sa.team_work_level IS NOT NULL 
                    AND sa.academic_knowledge_level IS NOT NULL 
                    THEN sa.student_id END) as assessed_students,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.personal_development_level IS NOT NULL THEN CAST(sa.personal_development_level AS DECIMAL) END) as avg_personal,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.critical_thinking_level IS NOT NULL THEN CAST(sa.critical_thinking_level AS DECIMAL) END) as avg_critical,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.team_work_level IS NOT NULL THEN CAST(sa.team_work_level AS DECIMAL) END) as avg_teamwork,
                AVG(CASE WHEN sa.attendance_status = 'present' AND sa.academic_knowledge_level IS NOT NULL THEN CAST(sa.academic_knowledge_level AS DECIMAL) END) as avg_academic,
                AVG(CASE WHEN sa.attendance_status = 'present' 
                    AND sa.personal_development_level IS NOT NULL 
                    AND sa.critical_thinking_level IS NOT NULL 
                    AND sa.team_work_level IS NOT NULL 
                    AND sa.academic_knowledge_level IS NOT NULL 
                    THEN (CAST(sa.personal_development_level AS DECIMAL) + CAST(sa.critical_thinking_level AS DECIMAL) + CAST(sa.team_work_level AS DECIMAL) + CAST(sa.academic_knowledge_level AS DECIMAL)) / 4.0 
                END) as avg_overall
            FROM schedules s
            LEFT JOIN schools sch ON s.school_id = sch.id
            LEFT JOIN student_attendance sa ON s.id = sa.schedule_id
            WHERE s.scheduled_date > CURRENT_DATE
            GROUP BY s.id, s.scheduled_date, s.scheduled_time, s.status, s.notes, sch.name, s.school_id
            ORDER BY s.scheduled_date ASC, s.scheduled_time ASC
            LIMIT 3
        `;

        const upcomingSchedulesResult = await client.query(upcomingSchedulesQuery);

        // Get stacked chart data with dynamic school information
        const stackedChartQuery = `
            SELECT 
                s.scheduled_date,
                sch.name as school_name,
                sch.id as school_id,
                COUNT(DISTINCT CASE 
                    WHEN sa.attendance_status = 'present' 
                    AND sa.personal_development_level IS NOT NULL 
                    AND sa.critical_thinking_level IS NOT NULL 
                    AND sa.team_work_level IS NOT NULL 
                    AND sa.academic_knowledge_level IS NOT NULL 
                    THEN sa.student_id END) as assessed_students,
                COUNT(DISTINCT st.id) as total_students
            FROM schedules s
            LEFT JOIN schools sch ON s.school_id = sch.id
            LEFT JOIN student_attendance sa ON s.id = sa.schedule_id
            LEFT JOIN students st ON st.school_id = sch.id
            GROUP BY s.scheduled_date, sch.name, sch.id
            ORDER BY s.scheduled_date DESC
        `;

        const stackedChartResult = await client.query(stackedChartQuery);

        // Get all schools for dynamic color mapping
        const schoolsQuery = `
            SELECT id, name 
            FROM schools 
            ORDER BY name
        `;

        const schoolsResult = await client.query(schoolsQuery);

        return NextResponse.json({
            success: true,
            data: {
                currentTime: currentTime,
                counts: {
                    totalStudents: countsResult.rows[0].total_students || 0,
                    totalTeachers: countsResult.rows[0].total_teachers || 0,
                    totalSchools: countsResult.rows[0].total_schools || 0,
                    totalLessons: countsResult.rows[0].total_lessons || 0,
                    totalSchedules: countsResult.rows[0].total_schedules || 0,
                    todaySchedules: countsResult.rows[0].today_schedules || 0
                },
                recentSchedules: recentSchedulesResult.rows,
                upcomingSchedules: upcomingSchedulesResult.rows,
                stackedChartData: stackedChartResult.rows,
                schools: schoolsResult.rows
            }
        });

    } catch (error) {
        console.error("Dashboard stats API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch dashboard stats",
                details: error.message
            },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
