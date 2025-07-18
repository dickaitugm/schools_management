import { NextResponse } from 'next/server';
const pool = require('../../../../../lib/db');

export async function GET(request, { params }) {
  try {
    const schoolId = params.id;
    console.log(`🔍 Checking relations for school ID: ${schoolId}`);

    const client = await pool.connect();
    
    try {
      // Initialize counters
      let studentsCount = 0;
      let teacherSchoolsCount = 0;
      let cashFlowCount = 0;
      let attendanceCount = 0;
      let studentTeachersCount = 0;

      // Check students table
      try {
        const studentsQuery = 'SELECT COUNT(*) as count FROM students WHERE school_id = $1';
        const studentsResult = await client.query(studentsQuery, [schoolId]);
        studentsCount = parseInt(studentsResult.rows[0].count) || 0;
        console.log(`📊 Students: ${studentsCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking students: ${error.message}`);
      }

      // Check teacher_schools table
      try {
        const teacherSchoolsQuery = 'SELECT COUNT(*) as count FROM teacher_schools WHERE school_id = $1';
        const teacherSchoolsResult = await client.query(teacherSchoolsQuery, [schoolId]);
        teacherSchoolsCount = parseInt(teacherSchoolsResult.rows[0].count) || 0;
        console.log(`📊 Teacher schools: ${teacherSchoolsCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking teacher_schools: ${error.message}`);
      }

      // Check cash_flow table
      try {
        const cashFlowQuery = 'SELECT COUNT(*) as count FROM cash_flow WHERE school_id = $1';
        const cashFlowResult = await client.query(cashFlowQuery, [schoolId]);
        cashFlowCount = parseInt(cashFlowResult.rows[0].count) || 0;
        console.log(`📊 Cash flow: ${cashFlowCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking cash_flow: ${error.message}`);
      }

      // Check student_attendance table (for students of this school)
      try {
        const attendanceQuery = `
          SELECT COUNT(*) as count 
          FROM student_attendance sa
          JOIN students s ON sa.student_id = s.id
          WHERE s.school_id = $1
        `;
        const attendanceResult = await client.query(attendanceQuery, [schoolId]);
        attendanceCount = parseInt(attendanceResult.rows[0].count) || 0;
        console.log(`📊 Student attendance: ${attendanceCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking student_attendance: ${error.message}`);
      }

      // Check student_teachers table (for students of this school)
      try {
        const studentTeachersQuery = `
          SELECT COUNT(*) as count 
          FROM student_teachers st
          JOIN students s ON st.student_id = s.id
          WHERE s.school_id = $1
        `;
        const studentTeachersResult = await client.query(studentTeachersQuery, [schoolId]);
        studentTeachersCount = parseInt(studentTeachersResult.rows[0].count) || 0;
        console.log(`📊 Student teachers: ${studentTeachersCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking student_teachers: ${error.message}`);
      }

      const hasRelations = studentsCount > 0 || teacherSchoolsCount > 0 || cashFlowCount > 0 || attendanceCount > 0 || studentTeachersCount > 0;

      console.log(`📋 School relations summary:`, {
        hasRelations,
        studentsCount,
        teacherSchoolsCount,
        cashFlowCount,
        attendanceCount,
        studentTeachersCount
      });

      return NextResponse.json({
        success: true,
        hasRelations,
        studentsCount,
        teacherSchoolsCount,
        cashFlowCount,
        attendanceCount,
        studentTeachersCount
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error checking school relations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check school relations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
