import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET all schools with pagination and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Query to get schools with search
    const schoolsQuery = `
      SELECT 
        id,
        name,
        address,
        phone,
        email,
        created_at
      FROM schools
      WHERE name ILIKE $1 OR address ILIKE $1 OR email ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    // Count total schools for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM schools
      WHERE name ILIKE $1 OR address ILIKE $1 OR email ILIKE $1
    `;

    const searchPattern = `%${search}%`;
    const client = await pool.connect();
    
    const [schoolsResult, countResult] = await Promise.all([
      client.query(schoolsQuery, [searchPattern, limit, offset]),
      client.query(countQuery, [searchPattern])
    ]);
    
    client.release();

    const schools = schoolsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: schools,
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
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

// POST new school
export async function POST(request) {
  try {
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
      'INSERT INTO schools (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [trimmedName, address?.trim(), phone?.trim(), email?.trim()]
    );
    client.release();
    
    return NextResponse.json({
      success: true,
      message: 'School created successfully',
      data: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating school:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505' && error.constraint === 'schools_name_unique') {
      return NextResponse.json(
        { success: false, error: 'School name already exists. Please choose a different name.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
