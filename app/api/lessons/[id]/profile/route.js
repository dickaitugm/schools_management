import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

// GET lesson profile with detailed information
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();
    
    // Get lesson basic info
    const lessonResult = await client.query('SELECT * FROM lessons WHERE id = $1', [id]);
    
    if (lessonResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    const lesson = lessonResult.rows[0];
    
    // Get teachers who teach this lesson with schools from completed schedules
    const teachersResult = await client.query(`
      SELECT t.*, lt.created_at as association_date,
        array_agg(DISTINCT s.name) as school_names
      FROM teachers t
      JOIN lesson_teachers lt ON t.id = lt.teacher_id
      LEFT JOIN schedule_teachers st ON t.id = st.teacher_id
      LEFT JOIN schedules sch ON st.schedule_id = sch.id AND sch.status = 'completed'
      LEFT JOIN schools s ON sch.school_id = s.id
      WHERE lt.lesson_id = $1
      GROUP BY t.id, lt.created_at
      ORDER BY t.name
    `, [id]);
    
    // Get schedules where this lesson is taught
    const schedulesResult = await client.query(`
      SELECT s.*, sch.name as school_name,
        array_agg(DISTINCT t.name) as teacher_names
      FROM schedules s
      JOIN schools sch ON s.school_id = sch.id
      JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      WHERE sl.lesson_id = $1
      GROUP BY s.id, sch.name
      ORDER BY s.scheduled_date DESC, s.scheduled_time
      LIMIT 20
    `, [id]);
    
    // Get student attendance for this lesson
    const attendanceResult = await client.query(`
      SELECT sa.student_id, sa.attendance_status, sa.knowledge_score, sa.participation_score,
        st.name as student_name, st.grade,
        s.scheduled_date, s.scheduled_time,
        sch.name as school_name
      FROM student_attendance sa
      JOIN schedules s ON sa.schedule_id = s.id
      JOIN schedule_lessons sl ON s.id = sl.schedule_id
      JOIN students st ON sa.student_id = st.id
      JOIN schools sch ON s.school_id = sch.id
      WHERE sl.lesson_id = $1
      ORDER BY s.scheduled_date DESC, s.scheduled_time DESC
      LIMIT 50
    `, [id]);
    
    // Get statistics
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM lesson_teachers WHERE lesson_id = $1) as total_teachers,
        (SELECT COUNT(*) FROM schedule_lessons WHERE lesson_id = $1) as total_schedules,
        (SELECT COUNT(*) FROM schedule_lessons sl 
         JOIN schedules s ON sl.schedule_id = s.id 
         WHERE sl.lesson_id = $1 AND s.scheduled_date >= CURRENT_DATE) as upcoming_schedules,
        (SELECT COUNT(DISTINCT sa.student_id) 
         FROM student_attendance sa
         JOIN schedules s ON sa.schedule_id = s.id
         JOIN schedule_lessons sl ON s.id = sl.schedule_id
         WHERE sl.lesson_id = $1) as total_students_taught,
        (SELECT ROUND(AVG(sa.knowledge_score), 2)
         FROM student_attendance sa
         JOIN schedules s ON sa.schedule_id = s.id
         JOIN schedule_lessons sl ON s.id = sl.schedule_id
         WHERE sl.lesson_id = $1 AND sa.knowledge_score IS NOT NULL) as avg_knowledge_score,
        (SELECT ROUND(AVG(sa.participation_score), 2)
         FROM student_attendance sa
         JOIN schedules s ON sa.schedule_id = s.id
         JOIN schedule_lessons sl ON s.id = sl.schedule_id
         WHERE sl.lesson_id = $1 AND sa.participation_score IS NOT NULL) as avg_participation_score
    `, [id]);
    
    // Get performance by school
    const performanceBySchoolResult = await client.query(`
      SELECT sch.name as school_name,
        COUNT(DISTINCT sa.student_id) as students_count,
        COUNT(sa.id) as total_sessions,
        ROUND(AVG(sa.knowledge_score), 2) as avg_knowledge_score,
        ROUND(AVG(sa.participation_score), 2) as avg_participation_score,
        COUNT(CASE WHEN sa.attendance_status = 'present' THEN 1 END) as present_count,
        COUNT(sa.id) as total_attendance_records
      FROM student_attendance sa
      JOIN schedules s ON sa.schedule_id = s.id
      JOIN schedule_lessons sl ON s.id = sl.schedule_id
      JOIN schools sch ON s.school_id = sch.id
      WHERE sl.lesson_id = $1
      GROUP BY sch.id, sch.name
      ORDER BY students_count DESC
    `, [id]);
    
    client.release();
    
    const profile = {
      lesson,
      teachers: teachersResult.rows,
      schedules: schedulesResult.rows,
      attendance_records: attendanceResult.rows,
      statistics: statsResult.rows[0],
      performance_by_school: performanceBySchoolResult.rows
    };
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching lesson profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson profile' },
      { status: 500 }
    );
  }
}
