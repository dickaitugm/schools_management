import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET - Fetch all permissions
export async function GET() {
  try {
    const query = `
      SELECT 
        id,
        name,
        description,
        category,
        created_at
      FROM permissions
      ORDER BY category, name
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new permission
export async function POST(request) {
  try {
    const { name, description, category } = await request.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Permission name is required'
      }, { status: 400 });
    }
    
    // Check if permission name already exists
    const existingPermission = await pool.query(
      'SELECT id FROM permissions WHERE name = $1',
      [name]
    );
    
    if (existingPermission.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Permission name already exists'
      }, { status: 400 });
    }
    
    // Insert new permission
    const query = `
      INSERT INTO permissions (name, description, category)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, category, created_at
    `;
    
    const result = await pool.query(query, [name, description, category]);
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
