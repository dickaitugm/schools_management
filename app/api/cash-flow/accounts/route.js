import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET all accounts
export async function GET() {
  try {
    const query = `
      SELECT id, account_name, account_type, balance, description, is_active
      FROM accounts
      WHERE is_active = true
      ORDER BY account_type, account_name
    `;
    
    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch accounts',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
