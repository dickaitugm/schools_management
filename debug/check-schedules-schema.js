const pool = require('../lib/db');

async function checkSchedulesSchema() {
    try {
        // Check schedules table structure
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            ORDER BY ordinal_position;
        `);

        console.log('Schedules table columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });

        // Check if there are any schedules
        const schedulesResult = await pool.query('SELECT * FROM schedules LIMIT 5');
        console.log('\nSample schedules data:');
        console.log(schedulesResult.rows);

    } catch (error) {
        console.error('Error checking schedules schema:', error);
    } finally {
        process.exit(0);
    }
}

checkSchedulesSchema();
