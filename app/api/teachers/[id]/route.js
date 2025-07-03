const { NextResponse } = require('next/server');
const pool = require('../../../../lib/db');

// GET - Fetch specific teacher by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const query = `
      SELECT 
        t.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', s.id,
              'name', s.name,
              'address', s.address,
              'phone', s.phone,
              'email', s.email
            )
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'
        ) as schools
      FROM teachers t
      LEFT JOIN teacher_schools ts ON t.id = ts.teacher_id
      LEFT JOIN schools s ON ts.school_id = s.id
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher' },
      { status: 500 }
    );
  }
}

// PUT - Update teacher
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, subject, phone, email, hire_date, school_ids = [] } = body;

    // Validate required fields
    if (!name || !subject) {
      return NextResponse.json(
        { success: false, error: 'Name and subject are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if teacher exists
      const checkQuery = 'SELECT id FROM teachers WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        );
      }

      // Update teacher
      const updateQuery = `
        UPDATE teachers 
        SET name = $1, subject = $2, phone = $3, email = $4, hire_date = $5
        WHERE id = $6
        RETURNING *
      `;
      
      await client.query(updateQuery, [
        name, subject, phone, email, hire_date || null, id
      ]);

      // Delete existing teacher-school relationships
      await client.query('DELETE FROM teacher_schools WHERE teacher_id = $1', [id]);

      // Insert new teacher-school relationships
      if (school_ids && school_ids.length > 0) {
        const schoolInsertPromises = school_ids.map(school_id =>
          client.query(
            'INSERT INTO teacher_schools (teacher_id, school_id) VALUES ($1, $2)',
            [id, school_id]
          )
        );
        await Promise.all(schoolInsertPromises);
      }

      await client.query('COMMIT');

      // Fetch updated teacher with schools
      const updatedTeacherQuery = `
        SELECT 
          t.*,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', s.id,
                'name', s.name
              )
            ) FILTER (WHERE s.id IS NOT NULL), 
            '[]'
          ) as schools
        FROM teachers t
        LEFT JOIN teacher_schools ts ON t.id = ts.teacher_id
        LEFT JOIN schools s ON ts.school_id = s.id
        WHERE t.id = $1
        GROUP BY t.id
      `;

      const result = await client.query(updatedTeacherQuery, [id]);

      return NextResponse.json({
        success: true,
        message: 'Teacher updated successfully',
        data: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating teacher:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Teacher email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

// DELETE - Delete teacher
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if teacher exists
      const checkQuery = 'SELECT id, name FROM teachers WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        );
      }

      const teacherName = checkResult.rows[0].name;

      // Check if teacher has any scheduled lessons
      const scheduleCheckQuery = `
        SELECT COUNT(*) as count 
        FROM schedule_teachers st
        JOIN schedules s ON st.schedule_id = s.id
        WHERE st.teacher_id = $1 AND s.scheduled_date >= CURRENT_DATE
      `;
      
      const scheduleResult = await client.query(scheduleCheckQuery, [id]);
      const hasUpcomingSchedules = parseInt(scheduleResult.rows[0].count) > 0;

      if (hasUpcomingSchedules) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete teacher with upcoming scheduled lessons. Please reassign or cancel the schedules first.' 
          },
          { status: 409 }
        );
      }

      // Delete teacher (CASCADE will handle teacher_schools and schedule_teachers)
      await client.query('DELETE FROM teachers WHERE id = $1', [id]);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Teacher "${teacherName}" deleted successfully`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}
