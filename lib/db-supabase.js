// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Supabase PostgreSQL connection
const supabasePool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  },
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT || 5432,
  database: process.env.SUPABASE_DB_NAME,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD
});

// Test connection
supabasePool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL database');
});

supabasePool.on('error', (err) => {
  console.error('❌ Supabase PostgreSQL connection error:', err);
});

module.exports = supabasePool;
