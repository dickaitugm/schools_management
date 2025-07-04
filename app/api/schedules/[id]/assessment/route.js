import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

// GET students for assessment (students in the school)
export async function GET(request, { params }) {
  try {
    const { id } = params; // schedule_id
    const client = await pool.connect();

    // Get schedule details first
    const scheduleResult = await client.query('SELECT * FROM schedules WHERE id = $1', [id]);
    
    if (scheduleResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const schedule = scheduleResult.rows[0];

    // Get students in the school with their current assessment if exists
    const studentsQuery = `
      SELECT 
        s.id,
        s.name,
        s.grade,
        s.age,
        sa.id as attendance_id,
        sa.attendance_status,
        sa.knowledge_score,
        sa.participation_score,
        sa.personal_development_level,
        sa.critical_thinking_level,
        sa.team_work_level,
        sa.academic_knowledge_level,
        sa.notes as assessment_notes,
        sa.updated_at as last_assessed
      FROM students s
      LEFT JOIN student_attendance sa ON s.id = sa.student_id AND sa.schedule_id = $1
      WHERE s.school_id = $2
      ORDER BY s.name
    `;

    const studentsResult = await client.query(studentsQuery, [id, schedule.school_id]);
    client.release();

    return NextResponse.json({
      success: true,
      data: {
        schedule,
        students: studentsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching students for assessment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students for assessment' },
      { status: 500 }
    );
  }
}

// POST/PUT student assessment
export async function POST(request, { params }) {
  try {
    const { id } = params; // schedule_id
    const assessments = await request.json(); // Array of student assessments

    if (!Array.isArray(assessments)) {
      return NextResponse.json(
        { success: false, error: 'Assessments must be an array' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const assessment of assessments) {
        const {
          student_id,
          attendance_status = 'present',
          knowledge_score,
          participation_score,
          personal_development_level,
          critical_thinking_level,
          team_work_level,
          academic_knowledge_level,
          notes
        } = assessment;

        // Check if assessment already exists
        const existingResult = await client.query(
          'SELECT id FROM student_attendance WHERE schedule_id = $1 AND student_id = $2',
          [id, student_id]
        );

        if (existingResult.rows.length > 0) {
          // Update existing assessment
          await client.query(
            `UPDATE student_attendance 
             SET attendance_status = $1, knowledge_score = $2, participation_score = $3,
                 personal_development_level = $4, critical_thinking_level = $5,
                 team_work_level = $6, academic_knowledge_level = $7, notes = $8,
                 updated_at = CURRENT_TIMESTAMP
             WHERE schedule_id = $9 AND student_id = $10`,
            [
              attendance_status, knowledge_score, participation_score,
              personal_development_level, critical_thinking_level,
              team_work_level, academic_knowledge_level, notes,
              id, student_id
            ]
          );
        } else {
          // Insert new assessment
          await client.query(
            `INSERT INTO student_attendance 
             (schedule_id, student_id, attendance_status, knowledge_score, participation_score,
              personal_development_level, critical_thinking_level, team_work_level, 
              academic_knowledge_level, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              id, student_id, attendance_status, knowledge_score, participation_score,
              personal_development_level, critical_thinking_level,
              team_work_level, academic_knowledge_level, notes
            ]
          );
        }
      }

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        message: 'Student assessments saved successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error saving student assessments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save student assessments' },
      { status: 500 }
    );
  }
}
