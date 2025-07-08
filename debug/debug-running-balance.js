// Debug script to understand the running balance calculation issue
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DATABASE || 'bb_society_db',
  password: process.env.POSTGRES_PASSWORD || 'dickaface',
  port: process.env.POSTGRES_PORT || 5432,
});

async function debugRunningBalance() {
  try {
    console.log('🔍 Debugging Running Balance Calculation...\n');

    // Get all transactions sorted by date ascending to understand the true running balance
    console.log('📊 All transactions sorted by date (oldest first):');
    const allTransactionsQuery = `
      SELECT 
        cf.id,
        cf.transaction_date,
        cf.created_at,
        cf.description,
        cf.transaction_type,
        cf.amount,
        cf.status
      FROM cash_flow cf
      WHERE cf.status = 'confirmed'
      ORDER BY cf.transaction_date ASC, cf.created_at ASC
    `;

    const allTxResult = await pool.query(allTransactionsQuery);
    const allTransactions = allTxResult.rows;

    console.log('Date       | Type    | Amount      | Manual Running Balance | Description');
    console.log('-----------|---------|-------------|------------------------|-------------');
    
    let manualRunningBalance = 0;
    allTransactions.forEach(tx => {
      if (tx.transaction_type === 'income') {
        manualRunningBalance += parseFloat(tx.amount);
      } else {
        manualRunningBalance -= parseFloat(tx.amount);
      }
      
      const date = tx.transaction_date.toISOString().split('T')[0];
      const type = tx.transaction_type.padEnd(7);
      const amount = `Rp ${parseFloat(tx.amount).toLocaleString('id-ID')}`.padEnd(11);
      const balance = `Rp ${manualRunningBalance.toLocaleString('id-ID')}`.padEnd(22);
      const desc = tx.description.substring(0, 30);
      console.log(`${date} | ${type} | ${amount} | ${balance} | ${desc}`);
    });

    console.log(`\n💰 Final Total Balance: Rp ${manualRunningBalance.toLocaleString('id-ID')}`);

    // Now let's check the subquery calculation for specific transactions
    console.log('\n🔍 Checking subquery calculation for the latest transaction:');
    
    if (allTransactions.length > 0) {
      const latestTx = allTransactions[allTransactions.length - 1]; // Last in ascending order = latest
      
      console.log(`Latest transaction: ${latestTx.description}`);
      console.log(`Date: ${latestTx.transaction_date.toISOString().split('T')[0]}`);
      console.log(`Type: ${latestTx.transaction_type}`);
      console.log(`Amount: Rp ${parseFloat(latestTx.amount).toLocaleString('id-ID')}`);
      
      // Test the subquery
      const subqueryTest = `
        SELECT 
          cf.id,
          cf.transaction_date,
          cf.created_at,
          cf.description,
          cf.transaction_type,
          cf.amount,
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
        WHERE cf.id = $1
      `;
      
      const subqueryResult = await pool.query(subqueryTest, [latestTx.id]);
      const subqueryBalance = parseFloat(subqueryResult.rows[0].running_balance);
      
      console.log(`Subquery Result: Rp ${subqueryBalance.toLocaleString('id-ID')}`);
      console.log(`Manual Calculation: Rp ${manualRunningBalance.toLocaleString('id-ID')}`);
      console.log(`Match: ${subqueryBalance === manualRunningBalance ? '✅ YES' : '❌ NO'}`);
    }

    // Check the first few transactions in descending order (what API returns)
    console.log('\n📋 First 5 transactions in descending order (what API returns):');
    const descOrderQuery = `
      SELECT 
        cf.id,
        cf.transaction_date,
        cf.created_at,
        cf.description,
        cf.transaction_type,
        cf.amount,
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
      WHERE cf.status = 'confirmed'
      ORDER BY cf.transaction_date DESC, cf.created_at DESC
      LIMIT 5
    `;

    const descResult = await pool.query(descOrderQuery);
    
    console.log('Date       | Type    | Amount      | API Running Balance | Description');
    console.log('-----------|---------|-------------|---------------------|-------------');
    
    descResult.rows.forEach(tx => {
      const date = tx.transaction_date.toISOString().split('T')[0];
      const type = tx.transaction_type.padEnd(7);
      const amount = `Rp ${parseFloat(tx.amount).toLocaleString('id-ID')}`.padEnd(11);
      const balance = `Rp ${parseFloat(tx.running_balance).toLocaleString('id-ID')}`.padEnd(19);
      const desc = tx.description.substring(0, 30);
      console.log(`${date} | ${type} | ${amount} | ${balance} | ${desc}`);
    });

    console.log('\n✅ Debug completed!');

  } catch (error) {
    console.error('❌ Error in debug:', error);
  } finally {
    await pool.end();
  }
}

debugRunningBalance();
