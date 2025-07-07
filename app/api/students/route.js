const { NextResponse } = require('next/server');
const pool = require('../../../lib/db');

// GET - Fetch all students with their school and assigned teachers
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const schoolId = searchParams.get('school_id') || '';
    const offset = (page - 1) * limit;

    // Query to get students with their school only (no teachers relation)
    let whereClause = `WHERE (s.name ILIKE $1 OR s.email ILIKE $1 OR s.grade ILIKE $1)`;
    let queryParams = [`%${search}%`, limit, offset];
    
    if (schoolId) {
      whereClause += ` AND s.school_id = $4`;
      queryParams = [`%${search}%`, limit, offset, schoolId];
    }

    const studentsQuery = `
      SELECT 
        s.id,
        s.name,
        s.grade,
        s.age,
        s.phone,
        s.email,
        s.enrollment_date,
        s.created_at,
        s.school_id,
        sc.name as school_name
      FROM students s
      LEFT JOIN schools sc ON s.school_id = sc.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    // Count total students for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM students s
      WHERE (s.name ILIKE $1 OR s.email ILIKE $1 OR s.grade ILIKE $1)
    `;
    let countParams = [`%${search}%`];
    
    if (schoolId) {
      countQuery += ` AND s.school_id = $2`;
      countParams = [`%${search}%`, schoolId];
    }

    const [studentsResult, countResult] = await Promise.all([
      pool.query(studentsQuery, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const students = studentsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: students,
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
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST - Create a new student
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, school_id, grade, age, phone, email, enrollment_date, teacher_ids = [] } = body;

    // Validate required fields
    if (!name || !school_id) {
      return NextResponse.json(
        { success: false, error: 'Name and school are required' },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert student
      const studentQuery = `
        INSERT INTO students (name, school_id, grade, age, phone, email, enrollment_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const studentResult = await client.query(studentQuery, [
        name, school_id, grade, age || null, phone, email, enrollment_date || null
      ]);
      
      const student = studentResult.rows[0];

      // Insert student-teacher relationships if teacher_ids provided
      if (teacher_ids && teacher_ids.length > 0) {
        const teacherInsertPromises = teacher_ids.map(teacher_id =>
          client.query(
            'INSERT INTO student_teachers (student_id, teacher_id) VALUES ($1, $2)',
            [student.id, teacher_id]
          )
        );
        await Promise.all(teacherInsertPromises);
      }

      await client.query('COMMIT');

      // Fetch the created student with school and teachers
      const createdStudentQuery = `
        SELECT 
          s.*,
          sc.name as school_name,
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
        FROM students s
        LEFT JOIN schools sc ON s.school_id = sc.id
        LEFT JOIN student_teachers st ON s.id = st.student_id
        LEFT JOIN teachers t ON st.teacher_id = t.id
        WHERE s.id = $1
        GROUP BY s.id, sc.name
      `;

      const result = await client.query(createdStudentQuery, [student.id]);

      return NextResponse.json({
        success: true,
        message: 'Student created successfully',
        data: result.rows[0]
      }, { status: 201 });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Student email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
