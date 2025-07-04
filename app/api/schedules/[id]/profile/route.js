import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

// GET schedule profile with detailed information
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule ID' },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      // Get basic schedule information first
      const basicScheduleResult = await client.query(`
        SELECT 
          s.*,
          sc.name as school_name,
          sc.address as school_address,
          sc.phone as school_phone,
          sc.email as school_email
        FROM schedules s
        LEFT JOIN schools sc ON s.school_id = sc.id
        WHERE s.id = $1
      `, [id]);
      
      if (basicScheduleResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        );
      }
      
      const schedule = basicScheduleResult.rows[0];
      
      // Get teachers assigned to this schedule
      const teachersResult = await client.query(`
        SELECT 
          t.id,
          t.name,
          t.subject,
          t.email,
          t.phone
        FROM teachers t
        JOIN schedule_teachers st ON t.id = st.teacher_id
        WHERE st.schedule_id = $1
        ORDER BY t.name
      `, [id]);
      
      // Get lessons assigned to this schedule
      const lessonsResult = await client.query(`
        SELECT 
          l.id,
          l.title,
          l.description,
          l.duration
        FROM lessons l
        JOIN schedule_lessons sl ON l.id = sl.lesson_id
        WHERE sl.schedule_id = $1
        ORDER BY l.title
      `, [id]);
      
      // Get students from the same school
      const studentsResult = await client.query(`
        SELECT *
        FROM students
        WHERE school_id = $1
        ORDER BY name
      `, [schedule.school_id]);
      
      // Get attendance records for this schedule
      const attendanceResult = await client.query(`
        SELECT 
          sa.*,
          s.name as student_name
        FROM student_attendance sa
        LEFT JOIN students s ON sa.student_id = s.id
        WHERE sa.schedule_id = $1
        ORDER BY sa.created_at DESC
      `, [id]);
      
      // Prepare profile data
      const profileData = {
        ...schedule,
        teachers: teachersResult.rows,
        lessons: lessonsResult.rows,
        students: studentsResult.rows,
        attendance: attendanceResult.rows,
        assessments: attendanceResult.rows.filter(a => a.knowledge_score !== null || a.participation_score !== null),
        stats: {
          total_teachers: teachersResult.rows.length,
          total_lessons: lessonsResult.rows.length,
          total_students: studentsResult.rows.length,
          total_attendance: attendanceResult.rows.length,
          total_assessments: attendanceResult.rows.filter(a => a.knowledge_score !== null || a.participation_score !== null).length,
          attendance_rate: attendanceResult.rows.length > 0 
            ? ((attendanceResult.rows.filter(a => a.attendance_status === 'present').length / attendanceResult.rows.length) * 100).toFixed(1)
            : 0
        }
      };
      
      return NextResponse.json({
        success: true,
        data: profileData
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error fetching schedule profile:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule profile: ' + error.message },
      { status: 500 }
    );
  }
}
