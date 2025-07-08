// Test script to verify cash flow running balance calculation
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DATABASE || 'bb_society_db',
  password: process.env.POSTGRES_PASSWORD || 'dickaface',
  port: process.env.POSTGRES_PORT || 5432,
});

async function testCashFlowRunningBalance() {
  try {
    console.log('🧪 Testing Cash Flow Running Balance Calculation...\n');

    // Test 1: Get first 10 transactions to verify running balance
    console.log('📊 Getting first 10 cash flow transactions with running balance:');
    const cashFlowQuery = `
      SELECT 
        cf.id,
        cf.transaction_date,
        cf.reference_number,
        cf.description,
        cf.transaction_type,
        cf.amount,
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
      LIMIT 10
    `;

    const cashFlowResult = await pool.query(cashFlowQuery);
    const transactions = cashFlowResult.rows;

    console.log('✅ Cash Flow Transactions with Running Balance:');
    console.log('Date       | Type    | Amount      | Running Balance | Description');
    console.log('-----------|---------|-------------|-----------------|-------------');
    
    transactions.forEach(tx => {
      const date = tx.transaction_date.toISOString().split('T')[0];
      const type = tx.transaction_type.padEnd(7);
      const amount = `Rp ${parseFloat(tx.amount).toLocaleString('id-ID')}`.padEnd(11);
      const balance = `Rp ${parseFloat(tx.running_balance).toLocaleString('id-ID')}`.padEnd(15);
      const desc = tx.description.substring(0, 30);
      console.log(`${date} | ${type} | ${amount} | ${balance} | ${desc}`);
    });

    // Test 2: Verify manual calculation for the latest transaction
    console.log('\n🔍 Manual verification of latest transaction running balance:');
    
    if (transactions.length > 0) {
      const latestTx = transactions[0];
      
      // Calculate manually up to this transaction
      const manualCalcQuery = `
        SELECT 
          SUM(
            CASE 
              WHEN transaction_type = 'income' THEN amount 
              WHEN transaction_type = 'expense' THEN -amount 
              ELSE 0 
            END
          ) as manual_running_balance
        FROM cash_flow 
        WHERE status = 'confirmed'
        AND (
          transaction_date < $1 OR 
          (transaction_date = $1 AND created_at <= $2)
        )
      `;
      
      const manualResult = await pool.query(manualCalcQuery, [
        latestTx.transaction_date, 
        latestTx.created_at
      ]);
      
      const manualBalance = parseFloat(manualResult.rows[0].manual_running_balance) || 0;
      const apiBalance = parseFloat(latestTx.running_balance);
      
      console.log(`Latest transaction: ${latestTx.description}`);
      console.log(`API Running Balance: Rp ${apiBalance.toLocaleString('id-ID')}`);
      console.log(`Manual Calculation:  Rp ${manualBalance.toLocaleString('id-ID')}`);
      console.log(`Match: ${apiBalance === manualBalance ? '✅ YES' : '❌ NO'}`);
    }

    // Test 3: Get current total balance
    console.log('\n💰 Current Total Balance:');
    const totalBalanceQuery = `
      SELECT 
        SUM(
          CASE 
            WHEN transaction_type = 'income' THEN amount 
            WHEN transaction_type = 'expense' THEN -amount 
            ELSE 0 
          END
        ) as total_balance
      FROM cash_flow 
      WHERE status = 'confirmed'
    `;
    
    const totalResult = await pool.query(totalBalanceQuery);
    const totalBalance = parseFloat(totalResult.rows[0].total_balance) || 0;
    console.log(`Total Balance: Rp ${totalBalance.toLocaleString('id-ID')}`);

    // Test 4: Compare with dashboard API structure
    console.log('\n📋 Dashboard Recent Cash Flow (what should be displayed):');
    const dashboardQuery = `
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

    const dashboardResult = await pool.query(dashboardQuery);
    
    console.log('✅ Dashboard Recent Cash Flow:');
    console.log('Date       | Type    | Amount      | Running Balance | Description');
    console.log('-----------|---------|-------------|-----------------|-------------');
    
    dashboardResult.rows.forEach(tx => {
      const date = tx.transaction_date.toISOString().split('T')[0];
      const type = tx.transaction_type.padEnd(7);
      const amount = `Rp ${parseFloat(tx.amount).toLocaleString('id-ID')}`.padEnd(11);
      const balance = `Rp ${parseFloat(tx.running_balance).toLocaleString('id-ID')}`.padEnd(15);
      const desc = tx.description.substring(0, 30);
      console.log(`${date} | ${type} | ${amount} | ${balance} | ${desc}`);
    });

    console.log('\n✅ Cash Flow Running Balance Test Completed!');

  } catch (error) {
    console.error('❌ Error testing cash flow running balance:', error);
  } finally {
    await pool.end();
  }
}

testCashFlowRunningBalance();
