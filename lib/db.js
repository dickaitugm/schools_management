// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production';
const useSupabase = process.env.USE_SUPABASE === 'true' || isProduction;
const hasSupabaseConfig = process.env.POSTGRES_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

let poolConfig;

if (useSupabase && hasSupabaseConfig) {
  // Use Supabase configuration with new environment variables
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  
  poolConfig = {
    connectionString: connectionString,
    ssl: isProduction ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
      secureContext: require('tls').createSecureContext({
        secureProtocol: 'TLSv1_2_method'
      })
    } : {
      rejectUnauthorized: false
    },
    // Additional production settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  console.log('🌐 Using Supabase database connection');
  console.log('📡 Connection type:', process.env.POSTGRES_URL_NON_POOLING ? 'Non-pooled' : 'Pooled');
  console.log('🔒 SSL mode:', isProduction ? 'Production (relaxed)' : 'Development');
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
