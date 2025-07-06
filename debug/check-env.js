// debug/check-env.js
// Script untuk debug environment variables

// Set NODE_ENV terlebih dahulu jika belum ada
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

require('dotenv').config({ path: '.env' });

console.log('🔧 Environment Variables Debug:');
console.log('======================================');
console.log('NODE_ENV:', process.env.NODE_ENV, '(type:', typeof process.env.NODE_ENV, ')');
console.log('USE_SUPABASE:', process.env.USE_SUPABASE, '(type:', typeof process.env.USE_SUPABASE, ')');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
console.log('POSTGRES_DATABASE:', process.env.POSTGRES_DATABASE);
console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
console.log('======================================');

// Test logic yang sama dengan db.js
const isDevelopment = process.env.NODE_ENV?.trim() === 'development';
const isProduction = process.env.NODE_ENV?.trim() === 'production';
let useSupabase;

console.log('🧪 Logic Test:');
console.log('NODE_ENV trimmed:', `"${process.env.NODE_ENV?.trim()}"`, 'vs "development"');
console.log('isDevelopment:', isDevelopment);
console.log('isProduction:', isProduction);

if (isDevelopment) {
  useSupabase = process.env.USE_SUPABASE?.trim() === 'true';
  console.log('Development logic - USE_SUPABASE check:', `"${process.env.USE_SUPABASE?.trim()}" === "true"`, '=', useSupabase);
} else {
  useSupabase = process.env.USE_SUPABASE?.trim() !== 'false';
  console.log('Production logic - USE_SUPABASE check:', `"${process.env.USE_SUPABASE?.trim()}" !== "false"`, '=', useSupabase);
}

console.log('Final useSupabase:', useSupabase);

if (useSupabase) {
  console.log('❌ AKAN MENGGUNAKAN SUPABASE');
} else {
  console.log('✅ AKAN MENGGUNAKAN LOCALHOST');
}
