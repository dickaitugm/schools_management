const pool = require('../lib/db');

async function addNewAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('🏦 Adding new bank accounts...');

    // New accounts to add
    const newAccounts = [
      {
        name: 'BRI',
        type: 'bank',
        description: 'Bank Rakyat Indonesia'
      },
      {
        name: 'BNI',
        type: 'bank',
        description: 'Bank Negara Indonesia'
      },
      {
        name: 'BSI',
        type: 'bank',
        description: 'Bank Syariah Indonesia'
      },
      {
        name: 'GoPay',
        type: 'cash',
        description: 'GoPay Digital Wallet'
      },
      {
        name: 'DANA',
        type: 'cash',
        description: 'DANA Digital Wallet'
      },
      {
        name: 'ShopeePay',
        type: 'cash',
        description: 'ShopeePay Digital Wallet'
      }
    ];

    // Check which accounts already exist
    for (const account of newAccounts) {
      const existingAccount = await client.query(
        'SELECT id FROM accounts WHERE account_name = $1',
        [account.name]
      );

      if (existingAccount.rows.length === 0) {
        await client.query(`
          INSERT INTO accounts (account_name, account_type, description, balance, is_active, created_at)
          VALUES ($1, $2, $3, 0, true, NOW())
        `, [
          account.name,
          account.type,
          account.description
        ]);
        console.log(`✅ Added account: ${account.name}`);
      } else {
        console.log(`⚠️  Account already exists: ${account.name}`);
      }
    }

    console.log('✅ Finished adding new accounts');
    
  } catch (error) {
    console.error('❌ Error adding accounts:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addNewAccounts();
    console.log('🎉 All done!');
  } catch (error) {
    console.error('Failed to add accounts:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { addNewAccounts };
