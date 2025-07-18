import { NextResponse } from 'next/server';
const pool = require('../../../../../lib/db');

export async function GET(request, { params }) {
  try {
    const teacherId = params.id;
    console.log(`🔍 Checking relations for teacher ID: ${teacherId}`);

    const client = await pool.connect();
    
    try {
      // Initialize counters
      let teacherSchoolsCount = 0;
      let studentTeachersCount = 0;
      let schedulesCount = 0;

      // Check teacher_schools table
      try {
        const teacherSchoolsQuery = 'SELECT COUNT(*) as count FROM teacher_schools WHERE teacher_id = $1';
        const teacherSchoolsResult = await client.query(teacherSchoolsQuery, [teacherId]);
        teacherSchoolsCount = parseInt(teacherSchoolsResult.rows[0].count) || 0;
        console.log(`📊 Teacher schools: ${teacherSchoolsCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking teacher_schools: ${error.message}`);
      }

      // Check student_teachers table
      try {
        const studentTeachersQuery = 'SELECT COUNT(*) as count FROM student_teachers WHERE teacher_id = $1';
        const studentTeachersResult = await client.query(studentTeachersQuery, [teacherId]);
        studentTeachersCount = parseInt(studentTeachersResult.rows[0].count) || 0;
        console.log(`📊 Student teachers: ${studentTeachersCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking student_teachers: ${error.message}`);
      }

      // Check schedules table
      try {
        const schedulesQuery = 'SELECT COUNT(*) as count FROM schedules WHERE teacher_id = $1';
        const schedulesResult = await client.query(schedulesQuery, [teacherId]);
        schedulesCount = parseInt(schedulesResult.rows[0].count) || 0;
        console.log(`📊 Schedules: ${schedulesCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking schedules: ${error.message}`);
      }

      const hasRelations = teacherSchoolsCount > 0 || studentTeachersCount > 0 || schedulesCount > 0;

      console.log(`📋 Teacher relations summary:`, {
        hasRelations,
        teacherSchoolsCount,
        studentTeachersCount,
        schedulesCount
      });

      return NextResponse.json({
        success: true,
        hasRelations,
        teacherSchoolsCount,
        studentTeachersCount,
        schedulesCount
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error checking teacher relations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check teacher relations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
