import { NextResponse } from 'next/server';
const pool = require('../../../../../lib/db');

export async function GET(request, { params }) {
  try {
    const lessonId = params.id;
    console.log(`🔍 Checking relations for lesson ID: ${lessonId}`);

    const client = await pool.connect();
    
    try {
      // Initialize counters
      let schedulesCount = 0;

      // Check schedules table
      try {
        const schedulesQuery = 'SELECT COUNT(*) as count FROM schedules WHERE lesson_id = $1';
        const schedulesResult = await client.query(schedulesQuery, [lessonId]);
        schedulesCount = parseInt(schedulesResult.rows[0].count) || 0;
        console.log(`📊 Schedules: ${schedulesCount}`);
      } catch (error) {
        console.log(`⚠️ Error checking schedules: ${error.message}`);
      }

      const hasRelations = schedulesCount > 0;

      console.log(`📋 Lesson relations summary:`, {
        hasRelations,
        schedulesCount
      });

      return NextResponse.json({
        success: true,
        hasRelations,
        schedulesCount
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error checking lesson relations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check lesson relations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
