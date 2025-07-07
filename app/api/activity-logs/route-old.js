import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const role = searchParams.get('role');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions = [];
    const params = [];
    let paramCount = 0;

    if (role && role !== 'all') {
      paramCount++;
      conditions.push(`user_role = $${paramCount}`);
      params.push(role);
    }

    if (action && action !== 'all') {
      paramCount++;
      conditions.push(`action = $${paramCount}`);
      params.push(action);
    }

    if (userId) {
      paramCount++;
      conditions.push(`user_id = $${paramCount}`);
      params.push(userId);
    }

    if (dateFrom) {
      paramCount++;
      conditions.push(`created_at >= $${paramCount}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      conditions.push(`created_at <= $${paramCount}::date + interval '1 day'`);
      params.push(dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get activity logs
    const query = `
      SELECT id, user_id, user_name, user_role, action, description, metadata, 
             ip_address, user_agent, session_id, created_at
      FROM activity_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(limit, offset);
    const result = await pool.query(query, params);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return Response.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch activity logs',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
      whereConditions.push(`action = ?`);
      params.push(action);
    }
    
    if (dateFrom) {
      whereConditions.push(`created_at >= ?`);
      params.push(dateFrom + ' 00:00:00');
    }
    
    if (dateTo) {
      whereConditions.push(`created_at <= ?`);
      params.push(dateTo + ' 23:59:59');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM activity_logs 
      ${whereClause}
    `;
    
    const countResult = await db.get(countQuery, params);
    const total = countResult.total;

    // Get logs with pagination
    const logsQuery = `
      SELECT 
        id,
        user_id,
        user_name,
        user_role,
        action,
        description,
        metadata,
        session_type,
        ip_address,
        user_agent,
        created_at
      FROM activity_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const logs = await db.all(logsQuery, [...params, limit, offset]);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return Response.json({
      success: true,
      data: logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalLogs: total,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      userName, 
      userRole, 
      action, 
      description, 
      metadata = {},
      sessionType = 'authenticated',
      ipAddress,
      userAgent 
    } = body;

    // Validate required fields
    if (!action || !description) {
      return Response.json(
        { success: false, error: 'Action and description are required' },
        { status: 400 }
      );
    }

    // Insert activity log
    const query = `
      INSERT INTO activity_logs (
        user_id, user_name, user_role, action, description, 
        metadata, session_type, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const result = await db.run(query, [
      userId || 'guest',
      userName || 'Guest User',
      userRole || 'guest',
      action,
      description,
      JSON.stringify(metadata),
      sessionType,
      ipAddress || null,
      userAgent || null
    ]);

    return Response.json({
      success: true,
      message: 'Activity log created successfully',
      data: { id: result.lastID }
    });

  } catch (error) {
    console.error('Error creating activity log:', error);
    return Response.json(
      { success: false, error: 'Failed to create activity log' },
      { status: 500 }
    );
  }
}
