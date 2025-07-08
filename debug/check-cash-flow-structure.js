const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function checkCashFlowStructure() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking Cash Flow Table Structure ===');
    
    // Check cash flow table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'cash_flow' 
      ORDER BY ordinal_position
    `;
    
    const structure = await client.query(structureQuery);
    console.log('Cash flow table structure:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check recent cash flow data
    const dataQuery = `
      SELECT 
        cf.*,
        s.name as school_name
      FROM cash_flow cf
      LEFT JOIN schools s ON cf.school_id = s.id
      ORDER BY cf.transaction_date DESC, cf.created_at DESC
      LIMIT 10
    `;
    
    const dataResult = await client.query(dataQuery);
    console.log('\nRecent cash flow data:');
    dataResult.rows.forEach(row => {
      console.log(`\\n  💰 ${row.school_name || 'No School'}`);
      console.log(`  📅 Date: ${row.transaction_date ? row.transaction_date.toDateString() : 'No date'}`);
      console.log(`  📝 Description: ${row.description || 'No description'}`);
      console.log(`  💵 Amount: ${row.amount || 0}`);
      console.log(`  📊 Type: ${row.transaction_type || 'No type'}`);
      console.log(`  📋 Category: ${row.category || 'No category'}`);
      console.log(`  📄 Reference: ${row.reference_number || 'No reference'}`);
      console.log(`  🏦 Account: ${row.account || 'No account'}`);
      console.log(`  📋 Status: ${row.status || 'No status'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCashFlowStructure();
