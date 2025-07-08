import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET all schedules with pagination and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const schoolId = searchParams.get('school_id') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    let whereClause = `WHERE (sch.name ILIKE $1 OR s.notes ILIKE $1)`;
    let queryParams = [`%${search}%`];
    let paramCount = 1;

    if (schoolId) {
      paramCount++;
      whereClause += ` AND s.school_id = $${paramCount}`;
      queryParams.push(schoolId);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND s.status = $${paramCount}`;
      queryParams.push(status);
    }

    const schedulesQuery = `
      SELECT 
        s.id,
        s.school_id,
        s.scheduled_date,
        s.scheduled_time,
        s.duration_minutes,
        s.status,
        s.notes,
        s.created_at,
        sch.name as school_name,
        sch.address as school_address,
        -- Count total students in this school
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.school_id) as total_students,
        -- Count assessed students for this specific schedule
        (SELECT COUNT(*) FROM student_attendance sa WHERE sa.schedule_id = s.id) as assessed_students
      FROM schedules s
      JOIN schools sch ON s.school_id = sch.id
      ${whereClause}
      ORDER BY s.scheduled_date DESC, s.scheduled_time DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    // Count total records
    const countQuery = `
      SELECT COUNT(s.id) as total
      FROM schedules s
      JOIN schools sch ON s.school_id = sch.id
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, paramCount);

    const client = await pool.connect();
    const [schedulesResult, countResult] = await Promise.all([
      client.query(schedulesQuery, queryParams),
      client.query(countQuery, countParams)
    ]);

    // Get teachers and lessons for each schedule
    const schedules = schedulesResult.rows;
    
    for (let schedule of schedules) {
      // Get teachers for this schedule
      const teachersResult = await client.query(`
        SELECT t.id, t.name, t.subject
        FROM teachers t
        JOIN schedule_teachers st ON t.id = st.teacher_id
        WHERE st.schedule_id = $1
      `, [schedule.id]);
      
      // Get lessons for this schedule
      const lessonsResult = await client.query(`
        SELECT l.id, l.title, l.description, l.duration_minutes
        FROM lessons l
        JOIN schedule_lessons sl ON l.id = sl.lesson_id
        WHERE sl.schedule_id = $1
      `, [schedule.id]);
      
      schedule.teachers = teachersResult.rows;
      schedule.lessons = lessonsResult.rows;
    }
    
    client.release();

    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      success: true,
      data: schedules,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST new schedule
export async function POST(request) {
  try {
    const { 
      school_id, 
      scheduled_date, 
      scheduled_time, 
      duration_minutes, 
      status = 'scheduled', 
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

      // Insert schedule
      const scheduleResult = await client.query(
        `INSERT INTO schedules (school_id, scheduled_date, scheduled_time, duration_minutes, status, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [school_id, scheduled_date, scheduled_time, duration_minutes || 60, status, notes]
      );

      const scheduleId = scheduleResult.rows[0].id;

      // Insert teacher associations
      if (teacher_ids && teacher_ids.length > 0) {
        for (const teacherId of teacher_ids) {
          await client.query(
            'INSERT INTO schedule_teachers (schedule_id, teacher_id) VALUES ($1, $2)',
            [scheduleId, teacherId]
          );
        }
      }

      // Insert lesson associations
      if (lesson_ids && lesson_ids.length > 0) {
        for (const lessonId of lesson_ids) {
          await client.query(
            'INSERT INTO schedule_lessons (schedule_id, lesson_id) VALUES ($1, $2)',
            [scheduleId, lessonId]
          );
        }
      }

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        data: scheduleResult.rows[0]
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
