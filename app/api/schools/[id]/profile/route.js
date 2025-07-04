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
    
    // Get teachers associated with this school
    const teachersResult = await client.query(`
      SELECT t.*, ts.created_at as association_date
      FROM teachers t
      JOIN teacher_schools ts ON t.id = ts.teacher_id
      WHERE ts.school_id = $1
      ORDER BY t.name
    `, [id]);
    
    // Get students in this school
    const studentsResult = await client.query(`
      SELECT * FROM students 
      WHERE school_id = $1 
      ORDER BY name
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
        (SELECT COUNT(*) FROM students WHERE school_id = $1) as total_students,
        (SELECT COUNT(*) FROM teacher_schools WHERE school_id = $1) as total_teachers,
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
