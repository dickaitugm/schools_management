import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function GET() {
    try {
        // Get basic counts
        const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM schools) as schools,
        (SELECT COUNT(*) FROM teachers) as teachers,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM lessons) as lessons,
        (SELECT COUNT(*) FROM schedules) as schedules
    `;

        // Get schedule data with student counts and assessment averages
        const scheduleDataQuery = `
      SELECT 
        s.id,
        s.scheduled_date,
        s.status,
        sch.name as school_name,
        sch.id as school_id,
        s.notes as lesson_title,
        -- Count properly assessed students (Present AND all assessment categories filled)
        (SELECT COUNT(*) 
         FROM student_attendance sa 
         WHERE sa.schedule_id = s.id 
         AND sa.attendance_status = 'present'
         AND sa.personal_development_level IS NOT NULL 
         AND sa.critical_thinking_level IS NOT NULL 
         AND sa.team_work_level IS NOT NULL 
         AND sa.academic_knowledge_level IS NOT NULL
        ) as student_count,
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_school_students,
        -- Assessment averages for completed schedules
        CASE 
          WHEN s.status = 'completed' THEN 
            ROUND((SELECT AVG(CAST(sa.personal_development_level AS DECIMAL)) 
                   FROM student_attendance sa 
                   WHERE sa.schedule_id = s.id 
                   AND sa.attendance_status = 'present'
                   AND sa.personal_development_level IS NOT NULL), 1)
          ELSE NULL 
        END as avg_personal_development,
        CASE 
          WHEN s.status = 'completed' THEN 
            ROUND((SELECT AVG(CAST(sa.critical_thinking_level AS DECIMAL)) 
                   FROM student_attendance sa 
                   WHERE sa.schedule_id = s.id 
                   AND sa.attendance_status = 'present'
                   AND sa.critical_thinking_level IS NOT NULL), 1)
          ELSE NULL 
        END as avg_critical_thinking,
        CASE 
          WHEN s.status = 'completed' THEN 
            ROUND((SELECT AVG(CAST(sa.team_work_level AS DECIMAL)) 
                   FROM student_attendance sa 
                   WHERE sa.schedule_id = s.id 
                   AND sa.attendance_status = 'present'
                   AND sa.team_work_level IS NOT NULL), 1)
          ELSE NULL 
        END as avg_team_work,
        CASE 
          WHEN s.status = 'completed' THEN 
            ROUND((SELECT AVG(CAST(sa.academic_knowledge_level AS DECIMAL)) 
                   FROM student_attendance sa 
                   WHERE sa.schedule_id = s.id 
                   AND sa.attendance_status = 'present'
                   AND sa.academic_knowledge_level IS NOT NULL), 1)
          ELSE NULL 
        END as avg_academic_knowledge,
        -- Overall average assessment
        CASE 
          WHEN s.status = 'completed' THEN 
            ROUND((SELECT AVG((CAST(sa.personal_development_level AS DECIMAL) + 
                               CAST(sa.critical_thinking_level AS DECIMAL) + 
                               CAST(sa.team_work_level AS DECIMAL) + 
                               CAST(sa.academic_knowledge_level AS DECIMAL)) / 4.0) 
                   FROM student_attendance sa 
                   WHERE sa.schedule_id = s.id 
                   AND sa.attendance_status = 'present'
                   AND sa.personal_development_level IS NOT NULL 
                   AND sa.critical_thinking_level IS NOT NULL 
                   AND sa.team_work_level IS NOT NULL 
                   AND sa.academic_knowledge_level IS NOT NULL), 1)
          ELSE NULL 
        END as overall_average
      FROM schedules s
      LEFT JOIN schools sch ON s.school_id = sch.id
      GROUP BY s.id, sch.name, sch.id, s.scheduled_date, s.status, s.notes
      ORDER BY s.scheduled_date DESC
    `;

        // Get schedule summary by status
        const scheduleStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM schedules
      GROUP BY status
    `;

        // Get students per school
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

        const [countsResult, scheduleDataResult, scheduleStatusResult, studentsPerSchoolResult] =
            await Promise.all([
                pool.query(countsQuery),
                pool.query(scheduleDataQuery),
                pool.query(scheduleStatusQuery),
                pool.query(studentsPerSchoolQuery),
            ]);

        const data = {
            // Basic stats
            ...countsResult.rows[0],

            // Schedule data for charts
            scheduleData: scheduleDataResult.rows,

            // Schedule status summary
            scheduleStatus: scheduleStatusResult.rows,

            // Students per school for bar chart
            studentsPerSchool: studentsPerSchoolResult.rows,

            // Additional analytics
            analytics: {
                totalActiveSchedules: scheduleDataResult.rows.filter(
                    (s) => s.status === "scheduled"
                ).length,
                totalCompletedSchedules: scheduleDataResult.rows.filter(
                    (s) => s.status === "completed"
                ).length,
                totalStudentsInSchedules: scheduleDataResult.rows.reduce(
                    (sum, s) => sum + parseInt(s.student_count),
                    0
                ),
                averageStudentsPerSchedule:
                    scheduleDataResult.rows.length > 0
                        ? (
                              scheduleDataResult.rows.reduce(
                                  (sum, s) => sum + parseInt(s.student_count),
                                  0
                              ) / scheduleDataResult.rows.length
                          ).toFixed(1)
                        : 0,
            },
        };

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch dashboard data",
            },
            { status: 500 }
        );
    }
}
