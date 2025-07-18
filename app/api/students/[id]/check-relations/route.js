const { NextResponse } = require('next/server');
const pool = require('../../../../../lib/db');

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Check attendance records
    const attendanceResult = await pool.query(
      'SELECT COUNT(*) as count FROM student_attendance WHERE student_id = $1',
      [id]
    );
    
    // Check student-teacher relationships
    const studentTeachersResult = await pool.query(
      'SELECT COUNT(*) as count FROM student_teachers WHERE student_id = $1',
      [id]
    );
    
    const attendanceCount = parseInt(attendanceResult.rows[0].count);
    const studentTeachersCount = parseInt(studentTeachersResult.rows[0].count);
    const hasRelations = attendanceCount > 0 || studentTeachersCount > 0;
    
    return NextResponse.json({
      success: true,
      hasRelations,
      attendanceCount,
      studentTeachersCount
    });
    
  } catch (error) {
    console.error('Error checking student relations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check student relations' },
      { status: 500 }
    );
  }
}
