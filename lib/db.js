// Load environment variables based on NODE_ENV
const dotenv = require('dotenv');
const path = require('path');

// Load appropriate .env file based on NODE_ENV
const nodeEnv = (process.env.NODE_ENV || 'development').trim();
if (nodeEnv === 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const { Pool } = require('pg');

// Determine environment and database configuration
const isProduction = nodeEnv === 'production';
const isDevelopment = nodeEnv === 'development';

// Lebih strict untuk development - jika development, paksa gunakan localhost kecuali explicitly USE_SUPABASE=true
let useSupabase;
if (isDevelopment) {
  useSupabase = process.env.USE_SUPABASE?.trim() === 'true';
} else {
  useSupabase = process.env.USE_SUPABASE?.trim() !== 'false';
}

console.log(`🌍 Environment: ${nodeEnv}`);
console.log(`🗃️ Using Supabase: ${useSupabase}`);
console.log(`🔧 USE_SUPABASE env var: "${process.env.USE_SUPABASE?.trim()}"`);
console.log(`🔧 NODE_ENV env var: "${nodeEnv}"`);

let poolConfig;

if (useSupabase) {
  // Supabase configuration (production or development with Supabase)
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  console.log('🔗 Connecting to Supabase PostgreSQL...');
  
  poolConfig = {
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
      ...(isProduction && {
        secureContext: require('tls').createSecureContext({
          secureProtocol: 'TLSv1_2_method'
        })
      })
    },
    // Connection pool settings
    max: isProduction ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  console.log('🌐 Using Supabase database connection');
  console.log('📡 Connection type:', process.env.POSTGRES_URL_NON_POOLING ? 'Non-pooled' : 'Pooled');
  console.log('🔒 SSL mode:', isProduction ? 'Production (secure)' : 'Development (relaxed)');
} else {
  // Local PostgreSQL configuration (development)
  console.log('🏠 Connecting to local PostgreSQL...');
  
  poolConfig = {
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: false,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DATABASE || 'schools_management_db',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    // Local development pool settings
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  };
  console.log('🏠 Using local PostgreSQL database connection');
  console.log('🗃️ Database:', poolConfig.database);
  console.log('👤 User:', poolConfig.user);
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
