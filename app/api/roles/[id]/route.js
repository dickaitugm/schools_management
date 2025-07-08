import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET - Fetch single role by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const query = `
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
      WHERE r.id = $1
      GROUP BY r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Update role
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, description, permissions = [] } = await request.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Role name is required'
      }, { status: 400 });
    }
    
    // Check if role name already exists for other roles
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE name = $1 AND id != $2',
      [name, id]
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
      
      // Update role
      const roleQuery = `
        UPDATE roles 
        SET name = $1, description = $2, permissions = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, name, description, permissions, updated_at
      `;
      
      const roleResult = await client.query(roleQuery, [
        name, description, JSON.stringify(permissions), id
      ]);
      
      if (roleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          error: 'Role not found'
        }, { status: 404 });
      }
      
      // Delete existing role_permissions relationships
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      
      // Insert new role permissions relationships
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
            [id, permission.id]
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
    console.error('Error updating role:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete role
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check if role exists
    const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [id]);
    
    if (roleCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 });
    }
    
    // Check if role is being used by any users
    const usersWithRole = await pool.query('SELECT id FROM users WHERE role_id = $1', [id]);
    
    if (usersWithRole.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete role: it is assigned to one or more users'
      }, { status: 400 });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete role_permissions relationships
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      
      // Delete role
      await client.query('DELETE FROM roles WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
