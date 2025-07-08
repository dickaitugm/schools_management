import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// DELETE specific transaction
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction ID is required' 
        },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const checkQuery = `SELECT id FROM cash_flow WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found' 
        },
        { status: 404 }
      );
    }

    // Delete the transaction
    const deleteQuery = `DELETE FROM cash_flow WHERE id = $1 RETURNING *`;
    const result = await pool.query(deleteQuery, [id]);

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete transaction',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Update specific transaction
export async function PUT(request, { params }) {
  try {
    const { id } = params;
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
      attachment_url,
      evidence_filename,
      evidence_size,
      evidence_type
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!description || !category || !transaction_type || !amount || !account) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: description, category, transaction_type, amount, account' 
        },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const checkQuery = `SELECT id FROM cash_flow WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found' 
        },
        { status: 404 }
      );
    }

    const query = `
      UPDATE cash_flow SET 
        transaction_date = $1,
        description = $2,
        category = $3,
        transaction_type = $4,
        amount = $5,
        account = $6,
        source = $7,
        school_id = $8,
        payment_method = $9,
        notes = $10,
        attachment_url = COALESCE($11, attachment_url),
        evidence_filename = COALESCE($12, evidence_filename),
        evidence_size = COALESCE($13, evidence_size),
        evidence_type = COALESCE($14, evidence_type),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;

    const result = await pool.query(query, [
      transaction_date,
      description,
      category,
      transaction_type,
      amount,
      account,
      source,
      school_id || null,
      payment_method || 'cash',
      notes,
      attachment_url,
      evidence_filename,
      evidence_size,
      evidence_type,
      id
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Transaction updated successfully'
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update transaction',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
