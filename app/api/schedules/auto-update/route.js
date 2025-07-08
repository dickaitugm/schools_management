import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// POST auto-update schedule statuses based on current time
export async function POST(request) {
  try {
    const client = await pool.connect();
    let updatedCount = 0;

    try {
      await client.query('BEGIN');

      // Get current timestamp
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 8);

      // Find schedules that need status updates
      const schedulesToUpdate = await client.query(`
        SELECT s.id, s.status, s.scheduled_date, s.scheduled_time
        FROM schedules s
        WHERE s.status IN ('scheduled', 'in-progress')
        AND (
          -- Past schedules that are still 'scheduled' should be 'in-progress'
          (s.status = 'scheduled' AND (
            s.scheduled_date < $1 OR 
            (s.scheduled_date = $1 AND s.scheduled_time <= $2)
          ))
        )
      `, [currentDate, currentTime]);

      // Update each schedule
      for (const schedule of schedulesToUpdate.rows) {
        const scheduleDateTime = new Date(`${schedule.scheduled_date}T${schedule.scheduled_time}`);
        const isFuture = scheduleDateTime > now;

        let newStatus = schedule.status;

        // If schedule time has passed and it's still 'scheduled', change to 'in-progress'
        if (!isFuture && schedule.status === 'scheduled') {
          newStatus = 'in-progress';
        }

        // Only update if status actually changed
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
        updatedCount: updatedCount
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
