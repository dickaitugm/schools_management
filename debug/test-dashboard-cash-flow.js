const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'bb_society_db',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'root',
});

async function testDashboardWithCashFlow() {
  const client = await pool.connect();
  
  try {
    console.log('=== Testing Dashboard with Cash Flow ===');
    
    // Test the cash flow query exactly as in the API
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
        s.name as school_name
      FROM cash_flow cf
      LEFT JOIN schools s ON cf.school_id = s.id
      WHERE cf.status = 'confirmed'
      ORDER BY cf.transaction_date DESC, cf.created_at DESC
      LIMIT 5
    `;
    
    const result = await client.query(recentCashFlowQuery);
    console.log('Recent Cash Flow (5 most recent):');
    
    let runningBalance = 0;
    result.rows.forEach((transaction, index) => {
      // Calculate running balance like in the table
      if (transaction.transaction_type === "income") {
        runningBalance += parseFloat(transaction.amount);
      } else {
        runningBalance -= parseFloat(transaction.amount);
      }
      
      console.log(`\\n  ${index + 1}. 💰 Transaction ${transaction.id}`);
      console.log(`     📅 Date: ${transaction.transaction_date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`);
      console.log(`     📄 Reference: ${transaction.reference_number}`);
      console.log(`     📝 Description: ${transaction.description}`);
      console.log(`     🏫 School: ${transaction.school_name || 'No School'}`);
      console.log(`     📊 Type: ${transaction.transaction_type}`);
      console.log(`     📋 Category: ${transaction.category}`);
      console.log(`     🏦 Account: ${transaction.account}`);
      console.log(`     💵 Amount: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(transaction.amount)}`);
      console.log(`     💰 Running Balance: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(runningBalance)}`);
    });
    
    console.log(`\\n📊 Total transactions fetched: ${result.rows.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDashboardWithCashFlow();
