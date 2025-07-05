// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Supabase PostgreSQL connection using new environment variables
const supabasePool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
    secureContext: require('tls').createSecureContext({
      secureProtocol: 'TLSv1_2_method'
    })
  } : {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  // Additional settings for better performance
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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
