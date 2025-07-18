import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET single schedule with full details
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();

    const scheduleQuery = `
      SELECT 
        s.*,
        sch.name as school_name,
        sch.address as school_address,
        COALESCE(
          JSON_AGG(
            DISTINCT JSON_BUILD_OBJECT(
              'id', t.id,
              'name', t.name,
              'subject', t.subject,
              'email', t.email
            )
          ) FILTER (WHERE t.id IS NOT NULL), 
          '[]'
        ) as teachers,
        COALESCE(
          JSON_AGG(
            DISTINCT JSON_BUILD_OBJECT(
              'id', l.id,
              'title', l.title,
              'description', l.description,
              'duration_minutes', l.duration_minutes,
              'target_grade', l.target_grade
            )
          ) FILTER (WHERE l.id IS NOT NULL), 
          '[]'
        ) as lessons
      FROM schedules s
      JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN schedule_teachers st ON s.id = st.schedule_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      LEFT JOIN schedule_lessons sl ON s.id = sl.schedule_id
      LEFT JOIN lessons l ON sl.lesson_id = l.id
      WHERE s.id = $1
      GROUP BY s.id, sch.name, sch.address
    `;

    const result = await client.query(scheduleQuery, [id]);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

// PUT update schedule
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { 
      school_id, 
      scheduled_date, 
      scheduled_time, 
      duration_minutes, 
      status, 
      notes,
      teacher_ids = [],
      lesson_ids = []
    } = await request.json();

    if (!school_id || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { success: false, error: 'School, date, and time are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update schedule
      const scheduleResult = await client.query(
        `UPDATE schedules 
         SET school_id = $1, scheduled_date = $2, scheduled_time = $3, 
             duration_minutes = $4, status = $5, notes = $6
         WHERE id = $7 RETURNING *`,
        [school_id, scheduled_date, scheduled_time, duration_minutes, status, notes, id]
      );

      if (scheduleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        );
      }

      // Update teacher associations
      await client.query('DELETE FROM schedule_teachers WHERE schedule_id = $1', [id]);
      if (teacher_ids && teacher_ids.length > 0) {
        for (const teacherId of teacher_ids) {
          await client.query(
            'INSERT INTO schedule_teachers (schedule_id, teacher_id) VALUES ($1, $2)',
            [id, teacherId]
          );
        }
      }

      // Update lesson associations
      await client.query('DELETE FROM schedule_lessons WHERE schedule_id = $1', [id]);
      if (lesson_ids && lesson_ids.length > 0) {
        for (const lessonId of lesson_ids) {
          await client.query(
            'INSERT INTO schedule_lessons (schedule_id, lesson_id) VALUES ($1, $2)',
            [id, lessonId]
          );
        }
      }

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        data: scheduleResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// DELETE schedule
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    console.log(`🗑️ DELETE Schedule ID: ${id}`);
    
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // First check if schedule exists and get details
      const checkQuery = `
        SELECT s.*, sch.name as school_name 
        FROM schedules s
        JOIN schools sch ON s.school_id = sch.id
        WHERE s.id = $1
      `;
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log(`❌ Schedule with ID ${id} not found`);
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        );
      }

      const schedule = checkResult.rows[0];
      console.log(`📅 Found schedule: ${schedule.scheduled_date} at ${schedule.scheduled_time} - ${schedule.school_name}`);

      // Delete the schedule
      const deleteResult = await client.query('DELETE FROM schedules WHERE id = $1', [id]);
      
      await client.query('COMMIT');

      console.log(`✅ Schedule deleted successfully`);

      return NextResponse.json({
        success: true,
        message: `Schedule for ${schedule.scheduled_date} at ${schedule.school_name} deleted successfully`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule: ' + error.message },
      { status: 500 }
    );
  }
}
