import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET dashboard statistics (optimized for counts only)
export async function GET() {
  try {
    const client = await pool.connect();
    
    // Get counts from all tables in a single query for better performance
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM schools) as schools_count,
        (SELECT COUNT(*) FROM teachers) as teachers_count,
        (SELECT COUNT(*) FROM students) as students_count,
        (SELECT COUNT(*) FROM lessons) as lessons_count,
        (SELECT COUNT(*) FROM schedules) as schedules_count
    `;
    
    const result = await client.query(statsQuery);
    client.release();
    
    const stats = result.rows[0];
    
    return NextResponse.json({
      success: true,
      data: {
        schools: parseInt(stats.schools_count) || 0,
        teachers: parseInt(stats.teachers_count) || 0,
        students: parseInt(stats.students_count) || 0,
        lessons: parseInt(stats.lessons_count) || 0,
        schedules: parseInt(stats.schedules_count) || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        data: {
          schools: 0,
          teachers: 0,
          students: 0,
          lessons: 0,
          schedules: 0,
        }
      },
      { status: 500 }
    );
  }
}
