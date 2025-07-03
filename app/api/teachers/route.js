const { NextResponse } = require('next/server');
const pool = require('../../../lib/db');

// GET - Fetch all teachers with their assigned schools
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Query to get teachers with their schools
    const teachersQuery = `
      SELECT 
        t.id,
        t.name,
        t.subject,
        t.phone,
        t.email,
        t.hire_date,
        t.created_at,
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
      WHERE t.name ILIKE $1 OR t.subject ILIKE $1 OR t.email ILIKE $1
      GROUP BY t.id, t.name, t.subject, t.phone, t.email, t.hire_date, t.created_at
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    // Count total teachers for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM teachers t
      WHERE t.name ILIKE $1 OR t.subject ILIKE $1 OR t.email ILIKE $1
    `;

    const searchPattern = `%${search}%`;
    const [teachersResult, countResult] = await Promise.all([
      pool.query(teachersQuery, [searchPattern, limit, offset]),
      pool.query(countQuery, [searchPattern])
    ]);

    const teachers = teachersResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: teachers,
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
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

// POST - Create a new teacher
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, subject, phone, email, hire_date, school_ids = [] } = body;

    // Validate required fields
    if (!name || !subject) {
      return NextResponse.json(
        { success: false, error: 'Name and subject are required' },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert teacher
      const teacherQuery = `
        INSERT INTO teachers (name, subject, phone, email, hire_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const teacherResult = await client.query(teacherQuery, [
        name, subject, phone, email, hire_date || null
      ]);
      
      const teacher = teacherResult.rows[0];

      // Insert teacher-school relationships if school_ids provided
      if (school_ids && school_ids.length > 0) {
        const schoolInsertPromises = school_ids.map(school_id =>
          client.query(
            'INSERT INTO teacher_schools (teacher_id, school_id) VALUES ($1, $2)',
            [teacher.id, school_id]
          )
        );
        await Promise.all(schoolInsertPromises);
      }

      await client.query('COMMIT');

      // Fetch the created teacher with schools
      const createdTeacherQuery = `
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

      const result = await client.query(createdTeacherQuery, [teacher.id]);

      return NextResponse.json({
        success: true,
        message: 'Teacher created successfully',
        data: result.rows[0]
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating teacher:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Teacher email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}
