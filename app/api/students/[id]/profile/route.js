import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

// GET student profile with detailed information
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();
    
    // Get student basic info with school
    const studentResult = await client.query(`
      SELECT s.*, sch.name as school_name, sch.address as school_address
      FROM students s
      JOIN schools sch ON s.school_id = sch.id
      WHERE s.id = $1
    `, [id]);
    
    if (studentResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    const student = studentResult.rows[0];
    
    // Get teachers teaching this student
    const teachersResult = await client.query(`
      SELECT t.*, st.created_at as association_date
      FROM teachers t
      JOIN student_teachers st ON t.id = st.teacher_id
      WHERE st.student_id = $1
      ORDER BY t.name
    `, [id]);
    
    // Get attendance records
    const attendanceResult = await client.query(`
      SELECT sa.*, s.scheduled_date, s.scheduled_time, s.duration_minutes,
        sch.name as school_name,
        array_agg(DISTINCT t.name) as teacher_names,
        array_agg(DISTINCT l.title) as lesson_titles
      FROM student_attendance sa
      JOIN schedules s ON sa.schedule_id = s.id
      JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      WHERE sa.student_id = $1
      GROUP BY sa.id, s.id, sch.name
      ORDER BY s.scheduled_date DESC, s.scheduled_time DESC
      LIMIT 20
    `, [id]);
    
    // Get upcoming schedules for this student's school
    const upcomingSchedulesResult = await client.query(`
      SELECT s.*, 
        array_agg(DISTINCT t.name) as teacher_names,
        array_agg(DISTINCT l.title) as lesson_titles
      FROM schedules s
      LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      WHERE s.school_id = $1 AND s.scheduled_date >= CURRENT_DATE
      GROUP BY s.id
      ORDER BY s.scheduled_date, s.scheduled_time
      LIMIT 10
    `, [student.school_id]);
    
    // Get statistics and performance
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM student_teachers WHERE student_id = $1) as total_teachers,
        (SELECT COUNT(*) FROM student_attendance WHERE student_id = $1) as total_attendances,
        (SELECT COUNT(*) FROM student_attendance WHERE student_id = $1 AND attendance_status = 'present') as present_count,
        (SELECT COUNT(*) FROM student_attendance WHERE student_id = $1 AND attendance_status = 'absent') as absent_count,
        (SELECT ROUND(AVG(knowledge_score), 2) FROM student_attendance WHERE student_id = $1 AND knowledge_score IS NOT NULL) as avg_knowledge_score,
        (SELECT ROUND(AVG(participation_score), 2) FROM student_attendance WHERE student_id = $1 AND participation_score IS NOT NULL) as avg_participation_score,
        (SELECT ROUND(AVG(personal_development_level), 2) FROM student_attendance WHERE student_id = $1 AND personal_development_level IS NOT NULL) as avg_personal_development,
        (SELECT ROUND(AVG(critical_thinking_level), 2) FROM student_attendance WHERE student_id = $1 AND critical_thinking_level IS NOT NULL) as avg_critical_thinking,
        (SELECT ROUND(AVG(team_work_level), 2) FROM student_attendance WHERE student_id = $1 AND team_work_level IS NOT NULL) as avg_team_work,
        (SELECT ROUND(AVG(academic_knowledge_level), 2) FROM student_attendance WHERE student_id = $1 AND academic_knowledge_level IS NOT NULL) as avg_academic_knowledge,
        (SELECT COUNT(*) FROM schedules s WHERE s.school_id = $2 AND s.scheduled_date >= CURRENT_DATE) as upcoming_schedules
    `, [id, student.school_id]);

    // Get recent assessments with detailed scores
    const assessmentsResult = await client.query(`
      SELECT sa.*, s.scheduled_date, s.scheduled_time,
        sch.name as school_name,
        array_agg(DISTINCT t.name) as teacher_names,
        array_agg(DISTINCT l.title) as lesson_titles
      FROM student_attendance sa
      JOIN schedules s ON sa.schedule_id = s.id
      JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      WHERE sa.student_id = $1 AND (
        sa.knowledge_score IS NOT NULL OR 
        sa.participation_score IS NOT NULL OR 
        sa.personal_development_level IS NOT NULL OR 
        sa.critical_thinking_level IS NOT NULL OR 
        sa.team_work_level IS NOT NULL OR 
        sa.academic_knowledge_level IS NOT NULL
      )
      GROUP BY sa.id, s.id, sch.name
      ORDER BY s.scheduled_date DESC, s.scheduled_time DESC
      LIMIT 10
    `, [id]);
    
    client.release();
    
    const stats = statsResult.rows[0];
    const attendanceRate = stats.total_attendances > 0 
      ? ((stats.present_count / stats.total_attendances) * 100).toFixed(2)
      : 0;
    
    const profile = {
      student,
      teachers: teachersResult.rows,
      attendance_records: attendanceResult.rows,
      assessments: assessmentsResult.rows,
      upcoming_schedules: upcomingSchedulesResult.rows,
      statistics: {
        ...stats,
        attendance_rate: attendanceRate
      }
    };
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}
