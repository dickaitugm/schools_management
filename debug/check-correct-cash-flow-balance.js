const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function checkTotalCashFlowBalance() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking Total Cash Flow Balance ===');
    
    // Calculate total balance from all confirmed transactions
    const totalBalanceQuery = `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN transaction_type = 'income' THEN amount 
            WHEN transaction_type = 'expense' THEN -amount 
            ELSE 0 
          END
        ), 0) as total_balance
      FROM cash_flow 
      WHERE status = 'confirmed'
    `;
    
    const totalResult = await client.query(totalBalanceQuery);
    const currentTotalBalance = parseFloat(totalResult.rows[0].total_balance);
    
    console.log(`💰 Current Total Balance: ${new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(currentTotalBalance)}`);
    
    // Get recent 5 transactions with proper running balance calculation
    const recentWithBalanceQuery = `
      SELECT 
        cf.id,
        cf.transaction_date,
        cf.reference_number,
        cf.description,
        cf.category,
        cf.transaction_type,
        cf.amount,
        cf.account,
        cf.status,
        s.name as school_name,
        cf.created_at,
        -- Calculate running balance up to each transaction (including this one)
        (
          SELECT COALESCE(SUM(
            CASE 
              WHEN cf_inner.transaction_type = 'income' THEN cf_inner.amount 
              WHEN cf_inner.transaction_type = 'expense' THEN -cf_inner.amount 
              ELSE 0 
            END
          ), 0)
          FROM cash_flow cf_inner 
          WHERE cf_inner.status = 'confirmed'
          AND (
            cf_inner.transaction_date < cf.transaction_date OR 
            (cf_inner.transaction_date = cf.transaction_date AND cf_inner.created_at <= cf.created_at)
          )
        ) as running_balance
      FROM cash_flow cf
      LEFT JOIN schools s ON cf.school_id = s.id
      WHERE cf.status = 'confirmed'
      ORDER BY cf.transaction_date DESC, cf.created_at DESC
      LIMIT 5
    `;
    
    const recentResult = await client.query(recentWithBalanceQuery);
    console.log('\\nRecent 5 transactions with correct running balance:');
    
    recentResult.rows.forEach((transaction, index) => {
      console.log(`\\n  ${index + 1}. 💰 ${transaction.description}`);
      console.log(`     📅 Date: ${transaction.transaction_date.toLocaleDateString("id-ID")}`);
      console.log(`     📊 Type: ${transaction.transaction_type}`);
      console.log(`     💵 Amount: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(transaction.amount)}`);
      console.log(`     💰 Balance at this point: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(transaction.running_balance || 0)}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTotalCashFlowBalance();
