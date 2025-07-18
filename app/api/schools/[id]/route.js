import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET single school
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM schools WHERE id = $1', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}

// PUT update school
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, address, phone, email } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'School name is required' },
        { status: 400 }
      );
    }

    // Trim and validate name
    const trimmedName = name.trim();

    const client = await pool.connect();
    const result = await client.query(
      'UPDATE schools SET name = $1, address = $2, phone = $3, email = $4 WHERE id = $5 RETURNING *',
      [trimmedName, address?.trim(), phone?.trim(), email?.trim(), id]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'School updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating school:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505' && error.constraint === 'schools_name_unique') {
      return NextResponse.json(
        { success: false, error: 'School name already exists. Please choose a different name.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

// DELETE school with cascade option
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const cascade = url.searchParams.get('cascade') === 'true';

    console.log(`🗑️ DELETE School ID: ${id}, Cascade: ${cascade}`);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if school exists
      const checkQuery = 'SELECT id, name FROM schools WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log(`❌ School with ID ${id} not found`);
        return NextResponse.json(
          { success: false, error: 'School not found' },
          { status: 404 }
        );
      }

      const schoolName = checkResult.rows[0].name;
      console.log(`🏫 Found school: ${schoolName}`);

      // Check if school has any related records
      const studentsCheckQuery = `
        SELECT COUNT(*) as count 
        FROM students
        WHERE school_id = $1
      `;
      
      const teachersCheckQuery = `
        SELECT COUNT(*) as count 
        FROM teacher_schools
        WHERE school_id = $1
      `;
      
      const cashFlowCheckQuery = `
        SELECT COUNT(*) as count 
        FROM cash_flow
        WHERE school_id = $1
      `;
      
      const [studentsResult, teachersResult, cashFlowResult] = await Promise.all([
        client.query(studentsCheckQuery, [id]),
        client.query(teachersCheckQuery, [id]),
        client.query(cashFlowCheckQuery, [id])
      ]);
      
      const studentsCount = parseInt(studentsResult.rows[0].count);
      const teachersCount = parseInt(teachersResult.rows[0].count);
      const cashFlowCount = parseInt(cashFlowResult.rows[0].count);
      const hasRelatedRecords = studentsCount > 0 || teachersCount > 0 || cashFlowCount > 0;

      console.log(`📊 Records found - Students: ${studentsCount}, Teachers: ${teachersCount}, CashFlow: ${cashFlowCount}, Has Relations: ${hasRelatedRecords}`);

      if (hasRelatedRecords && !cascade) {
        await client.query('ROLLBACK');
        console.log(`⚠️ Cannot delete - school has related records and cascade=false`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete school with existing records. Please remove related records first or use cascade delete.',
            code: 'FOREIGN_KEY_VIOLATION',
            details: {
              studentsCount,
              teachersCount,
              cashFlowCount
            },
            suggestion: 'Use cascade=true parameter to delete all related records'
          },
          { status: 409 }
        );
      }

      if (cascade && hasRelatedRecords) {
        // Delete all related records first
        console.log(`🗑️ Cascade delete - removing related records for school "${schoolName}"`);
        
        // Delete student attendance records first (if students exist)
        if (studentsCount > 0) {
          const attendanceDeleteResult = await client.query(
            'DELETE FROM student_attendance WHERE student_id IN (SELECT id FROM students WHERE school_id = $1)',
            [id]
          );
          console.log(`   - Deleted ${attendanceDeleteResult.rowCount} student attendance records`);
          
          // Delete student-teacher relationships
          const studentTeachersDeleteResult = await client.query(
            'DELETE FROM student_teachers WHERE student_id IN (SELECT id FROM students WHERE school_id = $1)',
            [id]
          );
          console.log(`   - Deleted ${studentTeachersDeleteResult.rowCount} student-teacher relationships`);
          
          // Delete students
          const studentsDeleteResult = await client.query(
            'DELETE FROM students WHERE school_id = $1',
            [id]
          );
          console.log(`   - Deleted ${studentsDeleteResult.rowCount} students`);
        }
        
        // Delete teacher-school relationships
        const teacherSchoolsDeleteResult = await client.query(
          'DELETE FROM teacher_schools WHERE school_id = $1',
          [id]
        );
        console.log(`   - Deleted ${teacherSchoolsDeleteResult.rowCount} teacher-school relationships`);
        
        // Delete cash flow records
        const cashFlowDeleteResult = await client.query(
          'DELETE FROM cash_flow WHERE school_id = $1',
          [id]
        );
        console.log(`   - Deleted ${cashFlowDeleteResult.rowCount} cash flow records`);
      }

      // Delete school
      await client.query('DELETE FROM schools WHERE id = $1', [id]);

      await client.query('COMMIT');

      const message = cascade && hasRelatedRecords
        ? `School "${schoolName}" and all related records (${studentsCount} students, ${teachersCount} teacher relations, ${cashFlowCount} cash flow records) deleted successfully`
        : `School "${schoolName}" deleted successfully`;

      return NextResponse.json({
        success: true,
        message: message,
        deletedRecords: cascade ? {
          studentsCount,
          teachersCount,
          cashFlowCount
        } : null
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete school: ' + error.message },
      { status: 500 }
    );
  }
}
