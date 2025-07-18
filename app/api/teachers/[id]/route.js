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

// DELETE - Delete teacher with cascade option
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const cascade = url.searchParams.get('cascade') === 'true';

    console.log(`🗑️ DELETE Teacher ID: ${id}, Cascade: ${cascade}`);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if teacher exists
      const checkQuery = 'SELECT id, name FROM teachers WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log(`❌ Teacher with ID ${id} not found`);
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        );
      }

      const teacherName = checkResult.rows[0].name;
      console.log(`👨‍🏫 Found teacher: ${teacherName}`);

      // Check if teacher has any related records
      const teacherSchoolsCheckQuery = 'SELECT COUNT(*) as count FROM teacher_schools WHERE teacher_id = $1';
      const studentTeachersCheckQuery = 'SELECT COUNT(*) as count FROM student_teachers WHERE teacher_id = $1';
      const schedulesCheckQuery = 'SELECT COUNT(*) as count FROM schedules WHERE teacher_id = $1';
      
      const [teacherSchoolsResult, studentTeachersResult, schedulesResult] = await Promise.all([
        client.query(teacherSchoolsCheckQuery, [id]),
        client.query(studentTeachersCheckQuery, [id]),
        client.query(schedulesCheckQuery, [id])
      ]);
      
      const teacherSchoolsCount = parseInt(teacherSchoolsResult.rows[0].count);
      const studentTeachersCount = parseInt(studentTeachersResult.rows[0].count);
      const schedulesCount = parseInt(schedulesResult.rows[0].count);
      const hasRelatedRecords = teacherSchoolsCount > 0 || studentTeachersCount > 0 || schedulesCount > 0;

      console.log(`📊 Records found - Teacher Schools: ${teacherSchoolsCount}, Student Teachers: ${studentTeachersCount}, Schedules: ${schedulesCount}, Has Relations: ${hasRelatedRecords}`);

      if (hasRelatedRecords && !cascade) {
        await client.query('ROLLBACK');
        console.log(`⚠️ Cannot delete - teacher has related records and cascade=false`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete teacher with existing records. Please remove related records first or use cascade delete.',
            code: 'FOREIGN_KEY_VIOLATION',
            details: {
              teacherSchoolsCount,
              studentTeachersCount,
              schedulesCount
            },
            suggestion: 'Use cascade=true parameter to delete all related records'
          },
          { status: 409 }
        );
      }

      if (cascade && hasRelatedRecords) {
        // Delete all related records first
        console.log(`🗑️ Cascade delete - removing related records for teacher "${teacherName}"`);
        
        // Delete schedules
        const schedulesDeleteResult = await client.query(
          'DELETE FROM schedules WHERE teacher_id = $1',
          [id]
        );
        console.log(`   - Deleted ${schedulesDeleteResult.rowCount} schedules`);
        
        // Delete student-teacher relationships
        const studentTeachersDeleteResult = await client.query(
          'DELETE FROM student_teachers WHERE teacher_id = $1',
          [id]
        );
        console.log(`   - Deleted ${studentTeachersDeleteResult.rowCount} student-teacher relationships`);
        
        // Delete teacher-school relationships
        const teacherSchoolsDeleteResult = await client.query(
          'DELETE FROM teacher_schools WHERE teacher_id = $1',
          [id]
        );
        console.log(`   - Deleted ${teacherSchoolsDeleteResult.rowCount} teacher-school relationships`);
      }

      // Delete teacher
      await client.query('DELETE FROM teachers WHERE id = $1', [id]);

      await client.query('COMMIT');

      const message = cascade && hasRelatedRecords
        ? `Teacher "${teacherName}" and all related records (${teacherSchoolsCount} school assignments, ${studentTeachersCount} student relations, ${schedulesCount} schedules) deleted successfully`
        : `Teacher "${teacherName}" deleted successfully`;

      return NextResponse.json({
        success: true,
        message: message,
        deletedRecords: cascade ? {
          teacherSchoolsCount,
          studentTeachersCount,
          schedulesCount
        } : null
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
      { success: false, error: 'Failed to delete teacher: ' + error.message },
      { status: 500 }
    );
  }
}
