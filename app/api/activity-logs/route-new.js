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

export async function POST(request) {
  try {
    const { 
      user_id, 
      user_name, 
      user_role, 
      action, 
      description, 
      metadata,
      ip_address,
      user_agent,
      session_id 
    } = await request.json();

    // Skip logging for guest users
    if (user_role === 'guest' || user_id === 'guest') {
      return Response.json({
        success: true,
        message: 'Guest activity not logged'
      });
    }

    // Validate required fields
    if (!user_id || !user_name || !user_role || !action || !description) {
      return Response.json(
        { 
          success: false, 
          error: 'Missing required fields: user_id, user_name, user_role, action, description' 
        },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO activity_logs (user_id, user_name, user_role, action, description, metadata, ip_address, user_agent, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `;

    const result = await pool.query(query, [
      user_id,
      user_name,
      user_role,
      action,
      description,
      metadata ? JSON.stringify(metadata) : null,
      ip_address,
      user_agent,
      session_id
    ]);

    return Response.json({
      success: true,
      data: {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at
      },
      message: 'Activity logged successfully'
    });

  } catch (error) {
    console.error('Error logging activity:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to log activity',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep')) || 30;

    // Delete old activity logs (older than specified days)
    const query = `
      DELETE FROM activity_logs 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await pool.query(query);

    return Response.json({
      success: true,
      message: `Deleted ${result.rowCount} old activity logs`,
      deletedCount: result.rowCount
    });

  } catch (error) {
    console.error('Error cleaning activity logs:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to clean activity logs',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
