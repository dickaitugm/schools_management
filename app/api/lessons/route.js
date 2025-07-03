const { NextResponse } = require('next/server');
const pool = require('../../../lib/db');

// GET - Fetch all lessons with their assigned teachers
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Query to get lessons with their teachers
    const lessonsQuery = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.duration_minutes,
        l.materials,
        l.target_grade,
        l.created_at,
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
      WHERE l.title ILIKE $1 OR l.description ILIKE $1 OR l.target_grade ILIKE $1
      GROUP BY l.id, l.title, l.description, l.duration_minutes, l.materials, l.target_grade, l.created_at
      ORDER BY l.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    // Count total lessons for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lessons l
      WHERE l.title ILIKE $1 OR l.description ILIKE $1 OR l.target_grade ILIKE $1
    `;

    const searchPattern = `%${search}%`;
    const [lessonsResult, countResult] = await Promise.all([
      pool.query(lessonsQuery, [searchPattern, limit, offset]),
      pool.query(countQuery, [searchPattern])
    ]);

    const lessons = lessonsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: lessons,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST - Create a new lesson
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, duration_minutes, materials, target_grade, teacher_ids = [] } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert lesson
      const lessonQuery = `
        INSERT INTO lessons (title, description, duration_minutes, materials, target_grade)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const lessonResult = await client.query(lessonQuery, [
        title, description, duration_minutes || 60, materials, target_grade
      ]);
      
      const lesson = lessonResult.rows[0];

      // Insert lesson-teacher relationships if teacher_ids provided
      if (teacher_ids && teacher_ids.length > 0) {
        const teacherInsertPromises = teacher_ids.map(teacher_id =>
          client.query(
            'INSERT INTO lesson_teachers (lesson_id, teacher_id) VALUES ($1, $2)',
            [lesson.id, teacher_id]
          )
        );
        await Promise.all(teacherInsertPromises);
      }

      await client.query('COMMIT');

      // Fetch the created lesson with teachers
      const createdLessonQuery = `
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

      const result = await client.query(createdLessonQuery, [lesson.id]);

      return NextResponse.json({
        success: true,
        message: 'Lesson created successfully',
        data: result.rows[0]
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating lesson:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
