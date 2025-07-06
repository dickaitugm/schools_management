# Environment Configuration Guide

Proyek School Management System ini sekarang mendukung dua environment:

## 🏗️ Environment Structure

- **Development (localhost)**: Menggunakan PostgreSQL lokal
- **Production (online)**: Menggunakan Supabase PostgreSQL

## 📁 File Environment

### `.env` (Development - Localhost)
```bash
NODE_ENV="development"
USE_SUPABASE="false"

# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/schools_management_db"
POSTGRES_URL="postgresql://postgres:password@localhost:5432/schools_management_db"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DATABASE="schools_management_db"
```

### `.env.local` (Production - Supabase)
```bash
NODE_ENV="production"
USE_SUPABASE="true"

# Supabase Configuration
POSTGRES_URL="postgres://postgres.xxx:xxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"
# ... dan konfigurasi Supabase lainnya
```

## 🚀 Cara Penggunaan (Windows)

### Development (Localhost) - RECOMMENDED
```cmd
# Test koneksi database terlebih dahulu
npm run db:test

# Jalankan development server dengan database lokal
npm run dev

# Atau gunakan batch script untuk restart bersih
restart-dev.bat

# Alternatif: double-click file batch
start-dev.bat
```

### Development dengan Supabase (Testing)
```cmd
# Untuk test fitur dengan Supabase di development
npm run dev:supabase
start-dev-supabase.bat
```

### Production (Supabase)
```cmd
# Build untuk production
npm run build

# Jalankan production server
npm run start
```

### Quick Restart
- `restart-dev.bat` - Kill existing processes and restart with local DB
- `start-dev.bat` - Development dengan PostgreSQL lokal
- `start-dev-supabase.bat` - Development dengan Supabase

### 🔧 Troubleshooting Development

#### Jika masih connect ke Supabase saat development:
1. Stop development server (Ctrl+C)
2. Run: `restart-dev.bat`
3. Atau manual: `npm run db:test` dulu untuk memastikan localhost OK

#### Error "self-signed certificate":
- Ini terjadi kalau masih connect ke Supabase
- Pastikan menggunakan `npm run dev` (bukan `npm start`)
- Check dengan: `npm run db:test` harus show "Using Supabase: false"

## 🛠️ Script Database

### Local Development
```bash
npm run db:migrate      # Migrate database lokal
npm run db:seed         # Seed data ke database lokal
npm run db:test         # Test koneksi database lokal
```

### Supabase
```bash
npm run db:migrate:supabase   # Migrate ke Supabase
npm run db:seed:supabase      # Seed data ke Supabase
npm run db:test:supabase      # Test koneksi Supabase
```

## 🔧 Setup PostgreSQL Lokal

### Windows
1. Download dan install PostgreSQL dari [postgresql.org](https://www.postgresql.org/download/windows/)
2. Pastikan PostgreSQL service berjalan
3. Buat database menggunakan pgAdmin atau command line:
   ```cmd
   # Menggunakan psql
   psql -U postgres
   CREATE DATABASE bb_society_db;
   \q
   
   # Atau menggunakan createdb
   set PGPASSWORD=dickaface
   createdb -h localhost -U postgres bb_society_db
   ```
4. Update password di `.env` jika berbeda dari "dickaface"

### macOS (menggunakan Homebrew)
```bash
brew install postgresql
brew services start postgresql
createdb schools_management_db
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb schools_management_db
```

## ⚠️ Penting

1. **Jangan commit file `.env.local`** ke git (sudah ada di .gitignore)
2. **Selalu backup database** sebelum menjalankan migration
3. **Gunakan environment yang tepat** untuk development dan production
4. **Update password** di `.env` sesuai dengan setup PostgreSQL lokal Anda

## 🔄 Switching Environment

Aplikasi otomatis akan memilih environment berdasarkan `NODE_ENV`:
- `NODE_ENV=development` → Gunakan `.env` → Database lokal
- `NODE_ENV=production` → Gunakan `.env.local` → Supabase

## 🚨 Troubleshooting

### Database Connection Error
1. Pastikan PostgreSQL berjalan (`pg_isready`)
2. Cek kredensial di file `.env`
3. Pastikan database sudah dibuat

### Environment Variables Not Loading
1. Restart development server
2. Cek format file `.env`
3. Pastikan tidak ada trailing spaces

### Supabase Connection Issues
1. Cek kredensial di `.env.local`
2. Pastikan Supabase project aktif
3. Cek network connection
