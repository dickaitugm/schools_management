const pool = require('../lib/db');

async function testCashFlow() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Cash Flow System...');

    // Test cash_flow table
    const transactionsResult = await client.query('SELECT COUNT(*) as total FROM cash_flow');
    const transactionsCount = parseInt(transactionsResult.rows[0].total);
    console.log(`💰 Cash Flow transactions: ${transactionsCount} records`);

    // Test income summary
    const incomeResult = await client.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM cash_flow 
      WHERE transaction_type = 'income' AND status = 'confirmed'
    `);
    const income = incomeResult.rows[0];
    console.log(`📈 Income: ${income.count} transactions, Total: Rp ${parseFloat(income.total).toLocaleString('id-ID')}`);

    // Test expense summary
    const expenseResult = await client.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM cash_flow 
      WHERE transaction_type = 'expense' AND status = 'confirmed'
    `);
    const expense = expenseResult.rows[0];
    console.log(`📉 Expenses: ${expense.count} transactions, Total: Rp ${parseFloat(expense.total).toLocaleString('id-ID')}`);

    // Calculate net income
    const netIncome = parseFloat(income.total) - parseFloat(expense.total);
    console.log(`💡 Net Income: Rp ${netIncome.toLocaleString('id-ID')} ${netIncome >= 0 ? '(Surplus)' : '(Deficit)'}`);

    // Test categories
    const categoriesResult = await client.query('SELECT COUNT(*) as total FROM cash_flow_categories WHERE is_active = true');
    const categoriesCount = parseInt(categoriesResult.rows[0].total);
    console.log(`🏷️ Categories: ${categoriesCount} active categories`);

    // Test accounts
    const accountsResult = await client.query('SELECT account_name, balance FROM accounts WHERE is_active = true ORDER BY account_name');
    console.log('🏦 Account Balances:');
    accountsResult.rows.forEach(account => {
      console.log(`   ${account.account_name}: Rp ${parseFloat(account.balance).toLocaleString('id-ID')}`);
    });

    // Test recent transactions
    const recentResult = await client.query(`
      SELECT 
        transaction_date,
        description,
        transaction_type,
        amount,
        category
      FROM cash_flow 
      WHERE status = 'confirmed'
      ORDER BY transaction_date DESC, created_at DESC 
      LIMIT 5
    `);
    
    console.log('📋 Recent Transactions:');
    recentResult.rows.forEach((transaction, index) => {
      const type = transaction.transaction_type === 'income' ? '💰' : '💸';
      const amount = parseFloat(transaction.amount).toLocaleString('id-ID');
      console.log(`   ${index + 1}. ${type} ${transaction.description} - Rp ${amount} (${transaction.category})`);
    });

    console.log('✅ Cash Flow system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing cash flow system:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the test
if (require.main === module) {
  testCashFlow()
    .then(() => {
      console.log('🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = testCashFlow;
