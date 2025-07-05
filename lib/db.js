// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production';
const useSupabase = process.env.USE_SUPABASE === 'true' || isProduction;
const hasSupabaseConfig = process.env.SUPABASE_DB_URL && process.env.NEXT_PUBLIC_SUPABASE_URL;

let poolConfig;

if (useSupabase && hasSupabaseConfig) {
  // Use Supabase configuration
  poolConfig = {
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log('🌐 Using Supabase database connection');
} else {
  // Use local PostgreSQL configuration
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    host: 'localhost',
    port: 5432,
    database: 'bb_society_db',
    user: 'postgres',
    password: 'semangka'
  };
  console.log('🏠 Using local PostgreSQL database connection');
}

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  const dbType = useSupabase && hasSupabaseConfig ? 'Supabase' : 'local PostgreSQL';
  console.log(`✅ Connected to ${dbType} database`);
});

pool.on('error', (err) => {
  const dbType = useSupabase && hasSupabaseConfig ? 'Supabase' : 'local PostgreSQL';
  console.error(`❌ ${dbType} connection error:`, err);
});

module.exports = pool;
