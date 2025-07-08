import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET cash flow transactions with filters and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const type = searchParams.get('type'); // 'income' or 'expense'
    const category = searchParams.get('category');
    const account = searchParams.get('account');
    const schoolId = searchParams.get('school_id');
    const status = searchParams.get('status') || 'confirmed';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [`status = $1`];
    const params = [status];
    let paramCount = 1;

    if (type) {
      paramCount++;
      conditions.push(`transaction_type = $${paramCount}`);
      params.push(type);
    }

    if (category) {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (account) {
      paramCount++;
      conditions.push(`account = $${paramCount}`);
      params.push(account);
    }

    if (schoolId) {
      paramCount++;
      conditions.push(`school_id = $${paramCount}`);
      params.push(schoolId);
    }

    if (dateFrom) {
      paramCount++;
      conditions.push(`transaction_date >= $${paramCount}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      conditions.push(`transaction_date <= $${paramCount}`);
      params.push(dateTo);
    }

    if (search) {
      paramCount++;
      conditions.push(`(description ILIKE $${paramCount} OR reference_number ILIKE $${paramCount} OR source ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM cash_flow ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get cash flow data with running balance
    const query = `
      SELECT 
        cf.*,
        s.name as school_name,
        -- Calculate running balance up to and including each transaction
        (
          SELECT COALESCE(SUM(
            CASE 
              WHEN cf_inner.transaction_type = 'income' THEN cf_inner.amount 
              WHEN cf_inner.transaction_type = 'expense' THEN -cf_inner.amount 
              ELSE 0 
            END
          ), 0)
          FROM cash_flow cf_inner 
          WHERE cf_inner.status = 'confirmed'
          AND (
            cf_inner.transaction_date < cf.transaction_date OR 
            (cf_inner.transaction_date = cf.transaction_date AND cf_inner.created_at <= cf.created_at)
          )
        ) as running_balance
      FROM cash_flow cf
      LEFT JOIN schools s ON cf.school_id = s.id
      ${whereClause}
      ORDER BY cf.transaction_date DESC, cf.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching cash flow:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cash flow data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create new cash flow transaction
export async function POST(request) {
  try {
    const {
      transaction_date,
      description,
      category,
      transaction_type,
      amount,
      account,
      source,
      school_id,
      payment_method,
      notes,
      recorded_by,
      attachment_url,
      evidence_filename,
      evidence_size,
      evidence_type
    } = await request.json();

    // Validate required fields
    if (!description || !category || !transaction_type || !amount || !account || !recorded_by) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: description, category, transaction_type, amount, account, recorded_by' 
        },
        { status: 400 }
      );
    }

    // Validate evidence is provided
    if (!attachment_url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Evidence document is required for all transactions' 
        },
        { status: 400 }
      );
    }

    // Generate reference number
    const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reference_number = `${transaction_type.toUpperCase()}-${currentDate}-${randomSuffix}`;

    const query = `
      INSERT INTO cash_flow (
        transaction_date, reference_number, description, category, transaction_type,
        amount, account, source, school_id, payment_method, notes, recorded_by,
        attachment_url, evidence_filename, evidence_size, evidence_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, reference_number, created_at
    `;

    const result = await pool.query(query, [
      transaction_date || new Date().toISOString().slice(0, 10),
      reference_number,
      description,
      category,
      transaction_type,
      amount,
      account,
      source,
      school_id || null,
      payment_method || 'cash',
      notes,
      recorded_by,
      attachment_url,
      evidence_filename,
      evidence_size,
      evidence_type
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Cash flow transaction created successfully'
    });

  } catch (error) {
    console.error('Error creating cash flow transaction:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reference number already exists' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create cash flow transaction',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
