// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Supabase PostgreSQL connection using new environment variables
const supabasePool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  }
});

// Test connection
supabasePool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL database');
  console.log('📡 Using connection:', process.env.POSTGRES_URL_NON_POOLING ? 'Non-pooled' : 'Pooled');
});

supabasePool.on('error', (err) => {
  console.error('❌ Supabase PostgreSQL connection error:', err);
});

module.exports = supabasePool;
