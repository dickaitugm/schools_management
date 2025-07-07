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
      // Get schools associated with this teacher through completed schedules
    const schoolsResult = await client.query(`
      SELECT DISTINCT s.*, MIN(sch.scheduled_date) as association_date
      FROM schools s
      JOIN schedules sch ON s.id = sch.school_id
      JOIN schedule_teachers st ON sch.id = st.schedule_id
      WHERE st.teacher_id = $1 AND sch.status = 'completed'
      GROUP BY s.id, s.name, s.address, s.phone, s.email, s.created_at
      ORDER BY s.name
    `, [id]);

    // Get students taught by this teacher through completed schedules
    const studentsResult = await client.query(`
      SELECT DISTINCT s.*, sch.name as school_name, MIN(schd.scheduled_date) as association_date
      FROM students s
      JOIN schools sch ON s.school_id = sch.id
      JOIN student_attendance sa ON s.id = sa.student_id
      JOIN schedules schd ON sa.schedule_id = schd.id
      JOIN schedule_teachers st ON schd.id = st.schedule_id
      WHERE st.teacher_id = $1 AND schd.status = 'completed'
      GROUP BY s.id, s.name, s.email, s.phone, s.grade, s.age, s.school_id, s.created_at, s.enrollment_date, sch.name
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
