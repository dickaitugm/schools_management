const pool = require('../lib/db');

async function createCashFlowTable() {
  const client = await pool.connect();
  
  try {
    // Create cash_flow table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cash_flow (
        id SERIAL PRIMARY KEY,
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        reference_number VARCHAR(50) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
        amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
        account VARCHAR(100) NOT NULL,
        source VARCHAR(200),
        school_id INTEGER REFERENCES schools(id),
        payment_method VARCHAR(50) DEFAULT 'cash',
        attachment_url TEXT,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        recorded_by VARCHAR(100) NOT NULL,
        approved_by VARCHAR(100),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cash_flow_categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cash_flow_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        account_name VARCHAR(100) NOT NULL UNIQUE,
        account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('cash', 'bank', 'petty_cash')),
        balance DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default categories
    await client.query(`
      INSERT INTO cash_flow_categories (name, type, description) VALUES
      ('Donations', 'income', 'Donations from individuals and organizations'),
      ('Grants', 'income', 'Government and institutional grants'),
      ('Fundraising', 'income', 'Income from fundraising events'),
      ('Other Income', 'income', 'Other miscellaneous income'),
      ('Salaries', 'expense', 'Staff salaries and wages'),
      ('Utilities', 'expense', 'Electricity, water, internet bills'),
      ('Supplies', 'expense', 'Educational and office supplies'),
      ('Maintenance', 'expense', 'Building and equipment maintenance'),
      ('Transportation', 'expense', 'Transportation costs'),
      ('Training', 'expense', 'Staff training and development'),
      ('Other Expenses', 'expense', 'Other miscellaneous expenses')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default accounts
    await client.query(`
      INSERT INTO accounts (account_name, account_type, balance, description) VALUES
      ('Main Cash', 'cash', 0, 'Main cash account'),
      ('Bank Account - BCA', 'bank', 0, 'Primary bank account'),
      ('Petty Cash', 'petty_cash', 0, 'Small daily expenses'),
      ('Bank Account - Mandiri', 'bank', 0, 'Secondary bank account')
      ON CONFLICT (account_name) DO NOTHING
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow(transaction_type);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_category ON cash_flow(category);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_account ON cash_flow(account);
      CREATE INDEX IF NOT EXISTS idx_cash_flow_school ON cash_flow(school_id);
    `);

    // Create trigger to update updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_cash_flow_updated_at ON cash_flow;
      CREATE TRIGGER update_cash_flow_updated_at
        BEFORE UPDATE ON cash_flow
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Cash flow tables created successfully!');
    console.log('📊 Tables created:');
    console.log('   - cash_flow (main transactions)');
    console.log('   - cash_flow_categories (income/expense categories)');
    console.log('   - accounts (cash, bank accounts)');
    console.log('💰 Default categories and accounts inserted');

  } catch (error) {
    console.error('❌ Error creating cash flow tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
if (require.main === module) {
  createCashFlowTable()
    .then(() => {
      console.log('🎉 Cash flow migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createCashFlowTable;
