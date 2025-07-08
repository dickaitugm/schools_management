import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// POST - Auto-update schedule statuses based on current time and assessment completion
export async function POST(request) {
  try {
    const client = await pool.connect();
    let updatedCount = 0;

    try {
      await client.query('BEGIN');

      // Get all schedules with their current status and assessment data
      const schedulesQuery = `
        SELECT 
          s.id,
          s.scheduled_date,
          s.scheduled_time,
          s.status,
          s.school_id,
          -- Count total students in this school
          (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_students,
          -- Count assessed students for this specific schedule
          (SELECT COUNT(*) FROM student_attendance sa 
           WHERE sa.schedule_id = s.id 
           AND (sa.personal_development_level IS NOT NULL 
                OR sa.critical_thinking_level IS NOT NULL 
                OR sa.team_work_level IS NOT NULL 
                OR sa.academic_knowledge_level IS NOT NULL)
          ) as assessed_students
        FROM schedules s
        WHERE s.status IN ('scheduled', 'in-progress')
        ORDER BY s.scheduled_date, s.scheduled_time
      `;

      const schedulesResult = await client.query(schedulesQuery);
      const schedules = schedulesResult.rows;

      const now = new Date();

      for (const schedule of schedules) {
        const scheduleDateTime = new Date(`${schedule.scheduled_date.toISOString().split('T')[0]}T${schedule.scheduled_time}`);
        let newStatus = schedule.status;

        // Determine the correct status based on time and assessment completion
        if (scheduleDateTime <= now) {
          // Schedule time has passed
          if (schedule.assessed_students === schedule.total_students && 
              schedule.assessed_students > 0) {
            // All students assessed - mark as completed
            newStatus = 'completed';
          } else {
            // Not all students assessed - mark as in-progress
            newStatus = 'in-progress';
          }
        } else {
          // Schedule is in the future - should be scheduled
          newStatus = 'scheduled';
        }

        // Update status if it changed
        if (newStatus !== schedule.status) {
          await client.query(
            'UPDATE schedules SET status = $1 WHERE id = $2',
            [newStatus, schedule.id]
          );
          updatedCount++;
        }
      }

      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: `Auto-updated ${updatedCount} schedule statuses`,
        updatedCount
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error auto-updating schedule statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-update schedule statuses' },
      { status: 500 }
    );
  }
}
