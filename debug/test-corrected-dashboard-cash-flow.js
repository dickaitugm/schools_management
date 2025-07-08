const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function testCorrectedDashboardCashFlow() {
  const client = await pool.connect();
  
  try {
    console.log('=== Testing Corrected Dashboard Cash Flow API ===');
    
    // Test the exact query from the updated API
    const recentCashFlowQuery = `
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
    
    const result = await client.query(recentCashFlowQuery);
    console.log('Dashboard Recent Cash Flow (corrected balance):');
    
    result.rows.forEach((transaction, index) => {
      console.log(`\\n  ${index + 1}. 💰 ${transaction.description}`);
      console.log(`     📅 Date: ${transaction.transaction_date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`);
      console.log(`     📄 Reference: ${transaction.reference_number}`);
      console.log(`     🏫 School: ${transaction.school_name || 'No School'}`);
      console.log(`     📊 Type: ${transaction.transaction_type}`);
      console.log(`     📋 Category: ${transaction.category}`);
      console.log(`     🏦 Account: ${transaction.account}`);
      
      const isIncome = transaction.transaction_type === "income";
      const incomeAmount = isIncome ? transaction.amount : 0;
      const expenseAmount = !isIncome ? transaction.amount : 0;
      
      console.log(`     💚 Income: ${isIncome ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(incomeAmount) : "-"}`);
      
      console.log(`     💸 Expense: ${!isIncome ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(expenseAmount) : "-"}`);
      
      console.log(`     💰 Total Balance: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(transaction.running_balance || 0)}`);
    });
    
    console.log(`\\n📊 Total transactions fetched: ${result.rows.length}`);
    console.log(`\\n✅ Latest balance should be the current total balance from all transactions.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testCorrectedDashboardCashFlow();
