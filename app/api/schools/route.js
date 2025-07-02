import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET all schools
export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM schools ORDER BY name');
    client.release();
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

// POST new school
export async function POST(request) {
  try {
    const { name, address, phone, email } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'School name is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO schools (name, address, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, address, phone, email]
    );
    client.release();
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
