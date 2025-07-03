const { NextResponse } = require('next/server');
const pool = require('../../../../lib/db');

// GET - Fetch specific student by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const query = `
      SELECT 
        s.*,
        sc.name as school_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', t.id,
              'name', t.name,
              'subject', t.subject
            )
          ) FILTER (WHERE t.id IS NOT NULL), 
          '[]'
        ) as teachers
      FROM students s
      LEFT JOIN schools sc ON s.school_id = sc.id
      LEFT JOIN student_teachers st ON s.id = st.student_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      WHERE s.id = $1
      GROUP BY s.id, sc.name
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT - Update student
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, school_id, grade, age, phone, email, enrollment_date, teacher_ids = [] } = body;

    // Validate required fields
    if (!name || !school_id) {
      return NextResponse.json(
        { success: false, error: 'Name and school are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if student exists
      const checkQuery = 'SELECT id FROM students WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        );
      }

      // Update student
      const updateQuery = `
        UPDATE students 
        SET name = $1, school_id = $2, grade = $3, age = $4, phone = $5, email = $6, enrollment_date = $7
        WHERE id = $8
        RETURNING *
      `;
      
      await client.query(updateQuery, [
        name, school_id, grade, age || null, phone, email, enrollment_date || null, id
      ]);

      // Delete existing student-teacher relationships
      await client.query('DELETE FROM student_teachers WHERE student_id = $1', [id]);

      // Insert new student-teacher relationships
      if (teacher_ids && teacher_ids.length > 0) {
        const teacherInsertPromises = teacher_ids.map(teacher_id =>
          client.query(
            'INSERT INTO student_teachers (student_id, teacher_id) VALUES ($1, $2)',
            [id, teacher_id]
          )
        );
        await Promise.all(teacherInsertPromises);
      }

      await client.query('COMMIT');

      // Fetch updated student with school and teachers
      const updatedStudentQuery = `
        SELECT 
          s.*,
          sc.name as school_name,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', t.id,
                'name', t.name,
                'subject', t.subject
              )
            ) FILTER (WHERE t.id IS NOT NULL), 
            '[]'
          ) as teachers
        FROM students s
        LEFT JOIN schools sc ON s.school_id = sc.id
        LEFT JOIN student_teachers st ON s.id = st.student_id
        LEFT JOIN teachers t ON st.teacher_id = t.id
        WHERE s.id = $1
        GROUP BY s.id, sc.name
      `;

      const result = await client.query(updatedStudentQuery, [id]);

      return NextResponse.json({
        success: true,
        message: 'Student updated successfully',
        data: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating student:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Student email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if student exists
      const checkQuery = 'SELECT id, name FROM students WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        );
      }

      const studentName = checkResult.rows[0].name;

      // Check if student has any attendance records
      const attendanceCheckQuery = `
        SELECT COUNT(*) as count 
        FROM student_attendance
        WHERE student_id = $1
      `;
      
      const attendanceResult = await client.query(attendanceCheckQuery, [id]);
      const hasAttendanceRecords = parseInt(attendanceResult.rows[0].count) > 0;

      if (hasAttendanceRecords) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete student with existing attendance records. Please remove attendance records first.' 
          },
          { status: 409 }
        );
      }

      // Delete student (CASCADE will handle student_teachers)
      await client.query('DELETE FROM students WHERE id = $1', [id]);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Student "${studentName}" deleted successfully`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
