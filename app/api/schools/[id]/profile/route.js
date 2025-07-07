import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

// GET school profile with detailed information
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();
    
    // Get school basic info
    const schoolResult = await client.query('SELECT * FROM schools WHERE id = $1', [id]);
    
    if (schoolResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }
    
    const school = schoolResult.rows[0];
      // Get teachers associated with this school through completed schedules
    const teachersResult = await client.query(`
      SELECT DISTINCT t.*, MIN(s.scheduled_date) as association_date
      FROM teachers t
      JOIN schedule_teachers st ON t.id = st.teacher_id
      JOIN schedules s ON st.schedule_id = s.id
      WHERE s.school_id = $1 AND s.status = 'completed'
      GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at
      ORDER BY t.name
    `, [id]);

    // Get students in this school through completed schedules
    const studentsResult = await client.query(`
      SELECT DISTINCT s.*, MIN(sch.scheduled_date) as enrollment_date
      FROM students s
      JOIN student_attendance sa ON s.id = sa.student_id
      JOIN schedules sch ON sa.schedule_id = sch.id
      WHERE sch.school_id = $1 AND sch.status = 'completed' AND s.school_id = $1
      GROUP BY s.id, s.name, s.email, s.phone, s.grade, s.age, s.school_id, s.created_at, s.enrollment_date
      ORDER BY s.name
    `, [id]);
    
    // Get lessons associated with this school through schedules
    const lessonsResult = await client.query(`
      SELECT DISTINCT l.*, COUNT(sl.schedule_id) as usage_count
      FROM lessons l
      JOIN schedule_lessons sl ON l.id = sl.lesson_id
      JOIN schedules s ON sl.schedule_id = s.id
      WHERE s.school_id = $1
      GROUP BY l.id
      ORDER BY usage_count DESC, l.title
    `, [id]);
    
    // Get schedules for this school
    const schedulesResult = await client.query(`
      SELECT s.*, 
        array_agg(DISTINCT t.name) as teacher_names,
        array_agg(DISTINCT l.title) as lesson_titles
      FROM schedules s
      LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      WHERE s.school_id = $1
      GROUP BY s.id
      ORDER BY s.scheduled_date DESC, s.scheduled_time
      LIMIT 10
    `, [id]);
    
    // Get statistics
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(DISTINCT s.id) FROM students s
         JOIN student_attendance sa ON s.id = sa.student_id
         JOIN schedules sch ON sa.schedule_id = sch.id
         WHERE sch.school_id = $1 AND sch.status = 'completed' AND s.school_id = $1) as total_students,
        (SELECT COUNT(DISTINCT t.id) FROM teachers t
         JOIN schedule_teachers st ON t.id = st.teacher_id
         JOIN schedules s ON st.schedule_id = s.id
         WHERE s.school_id = $1 AND s.status = 'completed') as total_teachers,
        (SELECT COUNT(DISTINCT l.id) FROM lessons l 
         JOIN schedule_lessons sl ON l.id = sl.lesson_id 
         JOIN schedules s ON sl.schedule_id = s.id 
         WHERE s.school_id = $1) as total_lessons,
        (SELECT COUNT(*) FROM schedules WHERE school_id = $1) as total_schedules,
        (SELECT COUNT(*) FROM schedules WHERE school_id = $1 AND scheduled_date >= CURRENT_DATE) as upcoming_schedules
    `, [id]);
    
    client.release();
    
    const profile = {
      school,
      teachers: teachersResult.rows,
      students: studentsResult.rows,
      lessons: lessonsResult.rows,
      recent_schedules: schedulesResult.rows,
      statistics: statsResult.rows[0]
    };
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching school profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school profile' },
      { status: 500 }
    );
  }
}
