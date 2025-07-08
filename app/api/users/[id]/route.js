import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import bcrypt from 'bcryptjs';

// GET - Fetch single user by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
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
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { username, email, password, name, role_id, is_active } = await request.json();
    
    // Validate required fields
    if (!username || !email || !name) {
      return NextResponse.json({
        success: false,
        error: 'Username, email, and name are required'
      }, { status: 400 });
    }
    
    // Check if username or email already exists for other users
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, id]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Username or email already exists'
      }, { status: 400 });
    }
    
    let query;
    let params;
    
    // Update with or without password
    if (password && password.trim() !== '') {
      // Hash new password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      query = `
        UPDATE users 
        SET username = $1, email = $2, password_hash = $3, name = $4, role_id = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, username, email, name, role_id, is_active, updated_at
      `;
      params = [username, email, password_hash, name, role_id, is_active, id];
    } else {
      // Update without password
      query = `
        UPDATE users 
        SET username = $1, email = $2, name = $3, role_id = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, username, email, name, role_id, is_active, updated_at
      `;
      params = [username, email, name, role_id, is_active, id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
