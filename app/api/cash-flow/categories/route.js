import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET all categories
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'income' or 'expense'
    
    let query = `
      SELECT id, name, type, description, is_active
      FROM cash_flow_categories
      WHERE is_active = true
    `;
    
    const params = [];
    
    if (type) {
      query += ` AND type = $1`;
      params.push(type);
    }
    
    query += ` ORDER BY type, name`;
    
    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
