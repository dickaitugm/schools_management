import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

// GET teacher profile with detailed information
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();
    
    // Get teacher basic info
    const teacherResult = await client.query('SELECT * FROM teachers WHERE id = $1', [id]);
    
    if (teacherResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    const teacher = teacherResult.rows[0];
    
    // Get schools associated with this teacher
    const schoolsResult = await client.query(`
      SELECT s.*, ts.created_at as association_date
      FROM schools s
      JOIN teacher_schools ts ON s.id = ts.school_id
      WHERE ts.teacher_id = $1
      ORDER BY s.name
    `, [id]);
    
    // Get students taught by this teacher
    const studentsResult = await client.query(`
      SELECT DISTINCT s.*, sch.name as school_name
      FROM students s
      JOIN student_teachers st ON s.id = st.student_id
      JOIN schools sch ON s.school_id = sch.id
      WHERE st.teacher_id = $1
      ORDER BY s.name
    `, [id]);
    
    // Get lessons taught by this teacher
    const lessonsResult = await client.query(`
      SELECT l.*, lt.created_at as association_date
      FROM lessons l
      JOIN lesson_teachers lt ON l.id = lt.lesson_id
      WHERE lt.teacher_id = $1
      ORDER BY l.title
    `, [id]);
    
    // Get recent schedules for this teacher
    const schedulesResult = await client.query(`
      SELECT s.*, sch.name as school_name,
        array_agg(DISTINCT l.title) as lesson_titles
      FROM schedules s
      JOIN schools sch ON s.school_id = sch.id
      JOIN schedule_teachers st ON s.id = st.schedule_id
      LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      WHERE st.teacher_id = $1
      GROUP BY s.id, sch.name
      ORDER BY s.scheduled_date DESC, s.scheduled_time
      LIMIT 10
    `, [id]);
    
    // Get statistics
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM teacher_schools WHERE teacher_id = $1) as total_schools,
        (SELECT COUNT(DISTINCT st.student_id) FROM student_teachers st WHERE st.teacher_id = $1) as total_students,
        (SELECT COUNT(*) FROM lesson_teachers WHERE teacher_id = $1) as total_lessons,
        (SELECT COUNT(*) FROM schedule_teachers st 
         JOIN schedules s ON st.schedule_id = s.id 
         WHERE st.teacher_id = $1) as total_schedules,
        (SELECT COUNT(*) FROM schedule_teachers st 
         JOIN schedules s ON st.schedule_id = s.id 
         WHERE st.teacher_id = $1 AND s.scheduled_date >= CURRENT_DATE) as upcoming_schedules
    `, [id]);
    
    client.release();
    
    const profile = {
      teacher,
      schools: schoolsResult.rows,
      students: studentsResult.rows,
      lessons: lessonsResult.rows,
      recent_schedules: schedulesResult.rows,
      statistics: statsResult.rows[0]
    };
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher profile' },
      { status: 500 }
    );
  }
}
