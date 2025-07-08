import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET() {
    try {
        const query = `
      SELECT 
        (SELECT COUNT(*) FROM schools) as schools,
        (SELECT COUNT(*) FROM teachers) as teachers,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM lessons) as lessons,
        (SELECT COUNT(*) FROM schedules) as schedules
    `;

        const result = await pool.query(query);

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Dashboard stats API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch dashboard stats",
            },
            { status: 500 }
        );
    }
}
