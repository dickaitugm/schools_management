#!/usr/bin/env node

// scripts/setup-local-db.js
// Script to set up local PostgreSQL database

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'bb_society_db';
const DB_USER = 'postgres';
const DB_PASSWORD = 'dickaface';

console.log('🚀 Setting up local PostgreSQL database for School Management System...\n');

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📝 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr && !stderr.includes('already exists')) {
        console.error(`⚠️  Warning: ${stderr}`);
      }
      console.log(`✅ ${description} completed`);
      if (stdout) console.log(stdout);
      resolve(stdout);
    });
  });
}

async function setupDatabase() {
  try {
    // Check if PostgreSQL is running (Windows version)
    await runCommand('pg_isready -h localhost -p 5432', 'Checking PostgreSQL connection');

    // Create database if it doesn't exist (Windows version with PGPASSWORD)
    const createDbCommand = process.platform === 'win32' 
      ? `set PGPASSWORD=${DB_PASSWORD} && createdb -h localhost -U ${DB_USER} ${DB_NAME}`
      : `PGPASSWORD=${DB_PASSWORD} createdb -h localhost -U ${DB_USER} ${DB_NAME}`;
    
    await runCommand(createDbCommand, 'Creating database').catch(() => {
      console.log('📋 Database already exists or creation failed, continuing...');
    });

    // Run migrations
    console.log('\n🔄 Running database migrations...');
    const migrateScript = path.join(__dirname, 'migrate.js');
    if (fs.existsSync(migrateScript)) {
      await runCommand(`node "${migrateScript}"`, 'Running migrations');
    } else {
      console.log('📋 No migration script found, skipping...');
    }

    // Run seeds
    console.log('\n🌱 Running database seeds...');
    const seedScript = path.join(__dirname, 'seed.js');
    if (fs.existsSync(seedScript)) {
      await runCommand(`node "${seedScript}"`, 'Running seeds');
    } else {
      console.log('📋 No seed script found, skipping...');
    }

    console.log('\n🎉 Local database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Make sure your .env file is configured correctly');
    console.log('   2. Run: npm run dev (for local development)');
    console.log('   3. Run: npm run dev:supabase (for Supabase testing)');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure PostgreSQL is installed and running');
    console.log('   2. Check your PostgreSQL user permissions');
    console.log('   3. Verify the database credentials in .env file');
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
