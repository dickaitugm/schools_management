const { NextResponse } = require('next/server');
const pool = require('../../../../lib/db');

// GET - Fetch specific lesson by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const query = `
      SELECT 
        l.*,
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
      FROM lessons l
      LEFT JOIN lesson_teachers lt ON l.id = lt.lesson_id
      LEFT JOIN teachers t ON lt.teacher_id = t.id
      WHERE l.id = $1
      GROUP BY l.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PUT - Update lesson
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, duration_minutes, materials, target_grade, teacher_ids = [] } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if lesson exists
      const checkQuery = 'SELECT id FROM lessons WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        );
      }

      // Update lesson
      const updateQuery = `
        UPDATE lessons 
        SET title = $1, description = $2, duration_minutes = $3, materials = $4, target_grade = $5
        WHERE id = $6
        RETURNING *
      `;
      
      await client.query(updateQuery, [
        title, description, duration_minutes || 60, materials, target_grade, id
      ]);

      // Delete existing lesson-teacher relationships
      await client.query('DELETE FROM lesson_teachers WHERE lesson_id = $1', [id]);

      // Insert new lesson-teacher relationships
      if (teacher_ids && teacher_ids.length > 0) {
        const teacherInsertPromises = teacher_ids.map(teacher_id =>
          client.query(
            'INSERT INTO lesson_teachers (lesson_id, teacher_id) VALUES ($1, $2)',
            [id, teacher_id]
          )
        );
        await Promise.all(teacherInsertPromises);
      }

      await client.query('COMMIT');

      // Fetch updated lesson with teachers
      const updatedLessonQuery = `
        SELECT 
          l.*,
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
        FROM lessons l
        LEFT JOIN lesson_teachers lt ON l.id = lt.lesson_id
        LEFT JOIN teachers t ON lt.teacher_id = t.id
        WHERE l.id = $1
        GROUP BY l.id
      `;

      const result = await client.query(updatedLessonQuery, [id]);

      return NextResponse.json({
        success: true,
        message: 'Lesson updated successfully',
        data: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating lesson:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE - Delete lesson with cascade option
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const cascade = url.searchParams.get('cascade') === 'true';

    console.log(`🗑️ DELETE Lesson ID: ${id}, Cascade: ${cascade}`);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if lesson exists
      const checkQuery = 'SELECT id, title FROM lessons WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log(`❌ Lesson with ID ${id} not found`);
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        );
      }

      const lessonTitle = checkResult.rows[0].title;
      console.log(`📚 Found lesson: ${lessonTitle}`);

      // Check if lesson has any related records
      const schedulesCheckQuery = 'SELECT COUNT(*) as count FROM schedules WHERE lesson_id = $1';
      
      const schedulesResult = await client.query(schedulesCheckQuery, [id]);
      const schedulesCount = parseInt(schedulesResult.rows[0].count);
      const hasRelatedRecords = schedulesCount > 0;

      console.log(`📊 Records found - Schedules: ${schedulesCount}, Has Relations: ${hasRelatedRecords}`);

      if (hasRelatedRecords && !cascade) {
        await client.query('ROLLBACK');
        console.log(`⚠️ Cannot delete - lesson has related records and cascade=false`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete lesson with existing schedules. Please remove related records first or use cascade delete.',
            code: 'FOREIGN_KEY_VIOLATION',
            details: {
              schedulesCount
            },
            suggestion: 'Use cascade=true parameter to delete all related records'
          },
          { status: 409 }
        );
      }

      if (cascade && hasRelatedRecords) {
        // Delete all related records first
        console.log(`🗑️ Cascade delete - removing related records for lesson "${lessonTitle}"`);
        
        // Delete schedules that use this lesson
        const schedulesDeleteResult = await client.query(
          'DELETE FROM schedules WHERE lesson_id = $1',
          [id]
        );
        console.log(`   - Deleted ${schedulesDeleteResult.rowCount} schedules`);
      }

      // Delete lesson
      await client.query('DELETE FROM lessons WHERE id = $1', [id]);

      await client.query('COMMIT');

      const message = cascade && hasRelatedRecords
        ? `Lesson "${lessonTitle}" and all related records (${schedulesCount} schedules) deleted successfully`
        : `Lesson "${lessonTitle}" deleted successfully`;

      return NextResponse.json({
        success: true,
        message: message,
        deletedRecords: cascade ? {
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
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson: ' + error.message },
      { status: 500 }
    );
  }
}
