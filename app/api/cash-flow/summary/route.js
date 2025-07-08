import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// GET cash flow summary and statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this_month'; // this_month, this_year, last_month, custom
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let dateCondition = '';
    let params = [];

    // Set date conditions based on period
    switch (period) {
      case 'all':
        // No date condition for all time
        dateCondition = '';
        break;
      case 'this_month':
        dateCondition = `AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) 
                        AND transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`;
        break;
      case 'last_month':
        dateCondition = `AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                        AND transaction_date < DATE_TRUNC('month', CURRENT_DATE)`;
        break;
      case 'this_year':
        dateCondition = `AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE)
                        AND transaction_date < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'`;
        break;
      case 'custom':
        if (dateFrom && dateTo) {
          dateCondition = `AND transaction_date >= $1 AND transaction_date <= $2`;
          params = [dateFrom, dateTo];
        }
        break;
    }

    // Get total income and expenses
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_count
      FROM cash_flow 
      WHERE status = 'confirmed' ${dateCondition}
    `;

    // Get income by category
    const incomeByCategoryQuery = `
      SELECT 
        category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM cash_flow 
      WHERE status = 'confirmed' AND transaction_type = 'income' ${dateCondition}
      GROUP BY category
      ORDER BY total_amount DESC
    `;

    // Get expenses by category
    const expensesByCategoryQuery = `
      SELECT 
        category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM cash_flow 
      WHERE status = 'confirmed' AND transaction_type = 'expense' ${dateCondition}
      GROUP BY category
      ORDER BY total_amount DESC
    `;

    // Get account balances
    const accountBalancesQuery = `
      SELECT 
        account_name,
        account_type,
        balance
      FROM accounts
      WHERE is_active = true
      ORDER BY account_type, account_name
    `;

    // Get recent transactions
    const recentTransactionsQuery = `
      SELECT 
        cf.*,
        s.name as school_name
      FROM cash_flow cf
      LEFT JOIN schools s ON cf.school_id = s.id
      WHERE cf.status = 'confirmed' ${dateCondition}
      ORDER BY cf.transaction_date DESC, cf.created_at DESC
      LIMIT 10
    `;

    // Execute all queries
    const [
      summaryResult,
      incomeByCategoryResult,
      expensesByCategoryResult,
      accountBalancesResult,
      recentTransactionsResult
    ] = await Promise.all([
      pool.query(summaryQuery, params),
      pool.query(incomeByCategoryQuery, params),
      pool.query(expensesByCategoryQuery, params),
      pool.query(accountBalancesQuery),
      pool.query(recentTransactionsQuery, params)
    ]);

    const summary = summaryResult.rows[0];
    const netIncome = parseFloat(summary.total_income) - parseFloat(summary.total_expenses);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_income: parseFloat(summary.total_income),
          total_expenses: parseFloat(summary.total_expenses),
          net_income: netIncome,
          income_count: parseInt(summary.income_count),
          expense_count: parseInt(summary.expense_count)
        },
        income_by_category: incomeByCategoryResult.rows.map(row => ({
          category: row.category,
          amount: parseFloat(row.total_amount),
          count: parseInt(row.transaction_count)
        })),
        expenses_by_category: expensesByCategoryResult.rows.map(row => ({
          category: row.category,
          amount: parseFloat(row.total_amount),
          count: parseInt(row.transaction_count)
        })),
        account_balances: accountBalancesResult.rows.map(row => ({
          account_name: row.account_name,
          account_type: row.account_type,
          balance: parseFloat(row.balance)
        })),
        recent_transactions: recentTransactionsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching cash flow summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cash flow summary',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
