// Check table structures
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bb_society_db',
  password: 'dickaface',
  port: 5432,
});

async function checkTableStructures() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking table structures...\n');
    
    // Check teachers table
    const teachersColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teachers' 
      ORDER BY ordinal_position
    `);
    console.log('Teachers table columns:');
    teachersColumns.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
    console.log();
    
    // Check schools table
    const schoolsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'schools' 
      ORDER BY ordinal_position
    `);
    console.log('Schools table columns:');
    schoolsColumns.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
    console.log();
    
    // Check students table
    const studentsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    console.log('Students table columns:');
    studentsColumns.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTableStructures();
