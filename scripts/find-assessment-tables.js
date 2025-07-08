const pool = require('../lib/db');

(async () => {
  try {
    console.log('=== Finding Assessment Related Tables ===');
    
    // Check all tables that contain 'assessment'
    const assessmentTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%assessment%'
    `);
    console.log('Assessment related tables:');
    assessmentTables.rows.forEach(table => {
      console.log(`  ${table.table_name}`);
    });
    
    // Check all tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\nAll tables:');
    allTables.rows.forEach(table => {
      console.log(`  ${table.table_name}`);
    });
    
    // Check schedules table structure
    const schedulesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      ORDER BY ordinal_position
    `);
    console.log('\nSchedules table columns:');
    schedulesColumns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
