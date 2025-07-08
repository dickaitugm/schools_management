const pool = require('../lib/db');

(async () => {
  try {
    console.log('=== Cash Flow Data Debug ===');
    
    // Check all cash flow records
    const allResult = await pool.query('SELECT * FROM cash_flow ORDER BY transaction_date DESC');
    console.log(`\nTotal records in cash_flow: ${allResult.rows.length}`);
    
    allResult.rows.forEach(row => {
      console.log(`ID: ${row.id}, Type: ${row.transaction_type}, Amount: ${row.amount}, Status: ${row.status}, Date: ${row.transaction_date}`);
    });
    
    // Check summary by type and status
    const summaryResult = await pool.query(`
      SELECT 
        transaction_type,
        status,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM cash_flow 
      GROUP BY transaction_type, status
      ORDER BY transaction_type, status
    `);
    
    console.log('\n=== Summary by Type and Status ===');
    summaryResult.rows.forEach(row => {
      console.log(`Type: ${row.transaction_type}, Status: ${row.status}, Total: ${row.total_amount}, Count: ${row.count}`);
    });
    
    // Check confirmed only
    const confirmedResult = await pool.query(`
      SELECT 
        transaction_type,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM cash_flow 
      WHERE status = 'confirmed'
      GROUP BY transaction_type
    `);
    
    console.log('\n=== Confirmed Transactions Only ===');
    confirmedResult.rows.forEach(row => {
      console.log(`Type: ${row.transaction_type}, Total: ${row.total_amount}, Count: ${row.count}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
