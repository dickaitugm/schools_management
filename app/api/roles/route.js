import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET - Fetch all roles
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includePermissions = searchParams.get('include_permissions') === 'true';
    
    let query;
    
    if (includePermissions) {
      query = `
        SELECT 
          r.id,
          r.name,
          r.description,
          r.permissions,
          r.created_at,
          r.updated_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'category', p.category
              )
            ) FILTER (WHERE p.id IS NOT NULL), 
            '[]'::json
          ) as permission_details
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        GROUP BY r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at
        ORDER BY r.created_at DESC
      `;
    } else {
      query = `
        SELECT id, name, description, permissions, created_at, updated_at
        FROM roles
        ORDER BY created_at DESC
      `;
    }
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new role
export async function POST(request) {
  try {
    const { name, description, permissions = [], is_active = true } = await request.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Role name is required'
      }, { status: 400 });
    }
    
    // Check if role name already exists
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [name]
    );
    
    if (existingRole.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Role name already exists'
      }, { status: 400 });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert new role
      const roleQuery = `
        INSERT INTO roles (name, description, permissions)
        VALUES ($1, $2, $3)
        RETURNING id, name, description, permissions, created_at
      `;
      
      const roleResult = await client.query(roleQuery, [
        name, description, JSON.stringify(permissions)
      ]);
      
      const roleId = roleResult.rows[0].id;
      
      // Insert role permissions relationships
      if (permissions && permissions.length > 0) {
        // Get permission names to IDs mapping
        const permissionQuery = `
          SELECT id, name FROM permissions WHERE name = ANY($1)
        `;
        const permissionResult = await client.query(permissionQuery, [permissions]);
        
        // Insert role_permissions relationships
        for (const permission of permissionResult.rows) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, permission.id]
          );
        }
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        data: roleResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
