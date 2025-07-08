const pool = require('../lib/db');

async function seedCashFlowData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding cash flow data...');

    // Sample income transactions
    const incomeTransactions = [
      {
        description: 'Donasi dari PT Maju Bersama untuk pembangunan perpustakaan',
        category: 'Donations',
        amount: 5000000,
        account: 'Bank Account - BCA',
        source: 'PT Maju Bersama',
        payment_method: 'bank_transfer',
        school_id: 1,
        transaction_date: '2024-12-01'
      },
      {
        description: 'Grant pemerintah untuk program pendidikan',
        category: 'Grants',
        amount: 10000000,
        account: 'Bank Account - BCA',
        source: 'Kementerian Pendidikan',
        payment_method: 'bank_transfer',
        transaction_date: '2024-12-02'
      },
      {
        description: 'Hasil fundraising acara charity dinner',
        category: 'Fundraising',
        amount: 3500000,
        account: 'Main Cash',
        source: 'Charity Dinner Event',
        payment_method: 'cash',
        transaction_date: '2024-12-03'
      },
      {
        description: 'Donasi individual dari alumni',
        category: 'Donations',
        amount: 1200000,
        account: 'Bank Account - Mandiri',
        source: 'Alumni Association',
        payment_method: 'online',
        school_id: 2,
        transaction_date: '2024-12-04'
      }
    ];

    // Sample expense transactions
    const expenseTransactions = [
      {
        description: 'Gaji guru dan staff bulan Desember 2024',
        category: 'Salaries',
        amount: 8500000,
        account: 'Bank Account - BCA',
        source: 'Staff Payroll',
        payment_method: 'bank_transfer',
        transaction_date: '2024-12-01'
      },
      {
        description: 'Pembayaran listrik dan air bulan November',
        category: 'Utilities',
        amount: 750000,
        account: 'Bank Account - BCA',
        source: 'PLN & PDAM',
        payment_method: 'bank_transfer',
        transaction_date: '2024-12-02'
      },
      {
        description: 'Pembelian buku dan alat tulis untuk siswa',
        category: 'Supplies',
        amount: 2300000,
        account: 'Petty Cash',
        source: 'Toko Buku Gramedia',
        payment_method: 'cash',
        school_id: 1,
        transaction_date: '2024-12-03'
      },
      {
        description: 'Perawatan komputer dan proyektor',
        category: 'Maintenance',
        amount: 850000,
        account: 'Main Cash',
        source: 'CV Teknik Komputer',
        payment_method: 'cash',
        school_id: 3,
        transaction_date: '2024-12-04'
      },
      {
        description: 'Transport guru ke pelatihan di Jakarta',
        category: 'Transportation',
        amount: 450000,
        account: 'Petty Cash',
        source: 'Travel Expense',
        payment_method: 'cash',
        transaction_date: '2024-12-05'
      },
      {
        description: 'Pelatihan kurikulum untuk guru',
        category: 'Training',
        amount: 1500000,
        account: 'Bank Account - Mandiri',
        source: 'Lembaga Pelatihan ABC',
        payment_method: 'bank_transfer',
        transaction_date: '2024-12-06'
      }
    ];

    // Insert income transactions
    for (const transaction of incomeTransactions) {
      const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const reference_number = `INCOME-${currentDate}-${randomSuffix}`;

      await client.query(`
        INSERT INTO cash_flow (
          transaction_date, reference_number, description, category, transaction_type,
          amount, account, source, school_id, payment_method, recorded_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        transaction.transaction_date,
        reference_number,
        transaction.description,
        transaction.category,
        'income',
        transaction.amount,
        transaction.account,
        transaction.source,
        transaction.school_id || null,
        transaction.payment_method,
        'System Admin',
        'confirmed'
      ]);
    }

    // Insert expense transactions
    for (const transaction of expenseTransactions) {
      const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const reference_number = `EXPENSE-${currentDate}-${randomSuffix}`;

      await client.query(`
        INSERT INTO cash_flow (
          transaction_date, reference_number, description, category, transaction_type,
          amount, account, source, school_id, payment_method, recorded_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        transaction.transaction_date,
        reference_number,
        transaction.description,
        transaction.category,
        'expense',
        transaction.amount,
        transaction.account,
        transaction.source,
        transaction.school_id || null,
        transaction.payment_method,
        'System Admin',
        'confirmed'
      ]);
    }

    // Update account balances based on transactions
    await client.query(`
      UPDATE accounts SET balance = (
        SELECT COALESCE(
          (SELECT SUM(amount) FROM cash_flow WHERE account = accounts.account_name AND transaction_type = 'income' AND status = 'confirmed') -
          (SELECT SUM(amount) FROM cash_flow WHERE account = accounts.account_name AND transaction_type = 'expense' AND status = 'confirmed'), 0
        )
      )
    `);

    console.log('✅ Cash flow sample data seeded successfully!');
    console.log('💰 Income transactions:', incomeTransactions.length);
    console.log('💸 Expense transactions:', expenseTransactions.length);
    console.log('🏦 Account balances updated');

  } catch (error) {
    console.error('❌ Error seeding cash flow data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding
if (require.main === module) {
  seedCashFlowData()
    .then(() => {
      console.log('🎉 Cash flow seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedCashFlowData;
