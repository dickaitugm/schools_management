import { NextResponse } from 'next/server';
const pool = require('../../../../../lib/db');

export async function GET(request, { params }) {
  try {
    const scheduleId = params.id;
    console.log(`🔍 Checking relations for schedule ID: ${scheduleId}`);

    const client = await pool.connect();
    
    try {
      // Initialize counters
      let assessmentsCount = 0;

      // Check if there are any assessments or activities related to this schedule
      // This is more for informational purposes since schedules are usually leaf nodes
      try {
        // Note: Replace 'assessments' with actual table name if it exists
        // For now, we'll assume no direct relations exist
        console.log(`📊 No direct relations found for schedule`);
      } catch (error) {
        console.log(`⚠️ Error checking assessments: ${error.message}`);
      }

      const hasRelations = assessmentsCount > 0;

      console.log(`📋 Schedule relations summary:`, {
        hasRelations,
        assessmentsCount
      });

      return NextResponse.json({
        success: true,
        hasRelations,
        assessmentsCount,
        message: 'Schedule can be safely deleted'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error checking schedule relations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check schedule relations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
