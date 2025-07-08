import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';

// GET - Fetch all users
export async function GET() {
  try {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.name,
        u.role,
        u.role_id,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        r.description as role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const { username, email, password, name, role_id, is_active = true } = await request.json();
    
    // Validate required fields
    if (!username || !email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'Username, email, password, and name are required'
      }, { status: 400 });
    }
    
    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Username or email already exists'
      }, { status: 400 });
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const query = `
      INSERT INTO users (username, email, password_hash, name, role_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, name, role_id, is_active, created_at
    `;
    
    const result = await pool.query(query, [
      username, email, password_hash, name, role_id, is_active
    ]);
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
