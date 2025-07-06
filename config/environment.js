// config/environment.js
// Environment configuration management

const dotenv = require('dotenv');
const path = require('path');

class EnvironmentConfig {
  constructor() {
    // Set default NODE_ENV jika belum ada
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development';
    }
    this.nodeEnv = process.env.NODE_ENV;
    this.loadEnvironmentFile();
  }

  loadEnvironmentFile() {
    let envFile;
    
    if (this.nodeEnv === 'production') {
      envFile = '.env.local';
    } else {
      envFile = '.env';
    }

    const envPath = path.resolve(process.cwd(), envFile);
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.warn(`⚠️  Warning: Could not load ${envFile}`);
    } else {
      console.log(`✅ Loaded environment from ${envFile}`);
    }
  }

  isDevelopment() {
    return this.nodeEnv === 'development';
  }

  isProduction() {
    return this.nodeEnv === 'production';
  }

  useSupabase() {
    return process.env.USE_SUPABASE === 'true';
  }

  getDatabaseConfig() {
    const useSupabase = this.useSupabase();
    
    if (useSupabase) {
      return {
        type: 'supabase',
        connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
        ssl: {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined,
          ...(this.isProduction() && {
            secureContext: require('tls').createSecureContext({
              secureProtocol: 'TLSv1_2_method'
            })
          })
        },
        pool: {
          max: this.isProduction() ? 20 : 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      };
    } else {
      return {
        type: 'local',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        database: process.env.POSTGRES_DATABASE || 'schools_management_db',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
        ssl: false,
        pool: {
          max: 5,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 5000,
        }
      };
    }
  }

  getSupabaseConfig() {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: process.env.SUPABASE_JWT_SECRET,
    };
  }

  logConfiguration() {
    console.log('🔧 Environment Configuration:');
    console.log(`   Environment: ${this.nodeEnv}`);
    console.log(`   Using Supabase: ${this.useSupabase()}`);
    
    const dbConfig = this.getDatabaseConfig();
    if (dbConfig.type === 'supabase') {
      console.log('   Database: Supabase PostgreSQL');
    } else {
      console.log('   Database: Local PostgreSQL');
      console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
      console.log(`   Database: ${dbConfig.database}`);
    }
  }
}

module.exports = new EnvironmentConfig();
