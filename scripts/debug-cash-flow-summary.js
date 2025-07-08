const pool = require('../lib/db');

async function debugCashFlowSummary() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging Cash Flow Summary...');

    // Check all transactions
    const allTransactionsResult = await client.query(`
      SELECT 
        transaction_type,
        status,
        amount,
        description
      FROM cash_flow 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 All Transactions:');
    allTransactionsResult.rows.forEach((transaction, index) => {
      const type = transaction.transaction_type === 'income' ? '💰' : '💸';
      console.log(`   ${index + 1}. ${type} ${transaction.description} - Rp ${parseFloat(transaction.amount).toLocaleString('id-ID')} (${transaction.status})`);
    });

    // Check confirmed transactions only
    const confirmedResult = await client.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_count
      FROM cash_flow 
      WHERE status = 'confirmed'
    `);

    const confirmed = confirmedResult.rows[0];
    console.log('\n✅ Confirmed Transactions Summary:');
    console.log(`   💰 Income: ${confirmed.income_count} transactions, Total: Rp ${parseFloat(confirmed.total_income).toLocaleString('id-ID')}`);
    console.log(`   💸 Expenses: ${confirmed.expense_count} transactions, Total: Rp ${parseFloat(confirmed.total_expenses).toLocaleString('id-ID')}`);
    console.log(`   💡 Net Income: Rp ${(parseFloat(confirmed.total_income) - parseFloat(confirmed.total_expenses)).toLocaleString('id-ID')}`);

    // Check all statuses
    const statusResult = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM cash_flow 
      GROUP BY status
    `);

    console.log('\n📊 Transaction Status Breakdown:');
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} transactions`);
    });

    // Check this month only
    const thisMonthResult = await client.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_count
      FROM cash_flow 
      WHERE status = 'confirmed' 
      AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) 
      AND transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `);

    const thisMonth = thisMonthResult.rows[0];
    console.log('\n📅 This Month Summary:');
    console.log(`   💰 Income: ${thisMonth.income_count} transactions, Total: Rp ${parseFloat(thisMonth.total_income).toLocaleString('id-ID')}`);
    console.log(`   💸 Expenses: ${thisMonth.expense_count} transactions, Total: Rp ${parseFloat(thisMonth.total_expenses).toLocaleString('id-ID')}`);

    console.log('\n✅ Cash Flow summary debug completed!');

  } catch (error) {
    console.error('❌ Error debugging cash flow summary:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the debug
if (require.main === module) {
  debugCashFlowSummary()
    .then(() => {
      console.log('🎉 Debug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Debug failed:', error);
      process.exit(1);
    });
}

module.exports = debugCashFlowSummary;
