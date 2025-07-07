import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET single school
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM schools WHERE id = $1', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}

// PUT update school
export async function PUT(request, { params }) {
  try {
    const { id } = params;
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
      'UPDATE schools SET name = $1, address = $2, phone = $3, email = $4 WHERE id = $5 RETURNING *',
      [trimmedName, address?.trim(), phone?.trim(), email?.trim(), id]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'School updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating school:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505' && error.constraint === 'schools_name_unique') {
      return NextResponse.json(
        { success: false, error: 'School name already exists. Please choose a different name.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

// DELETE school
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const client = await pool.connect();
    const result = await client.query('DELETE FROM schools WHERE id = $1 RETURNING *', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}
