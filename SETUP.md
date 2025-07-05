# 🚀 Quick Setup Guide for BB for Society Information System

## 📋 Prerequisites
1. Install Node.js (v18+): https://nodejs.org/
2. **Choose Database Option:**
   - **Local**: Install PostgreSQL (v12+): https://www.postgresql.org/download/
   - **Cloud**: Create Supabase account: https://supabase.com (free tier available)

## ⚡ Quick Installation

### 📖 Choose Your Database Setup
- **Option A**: [Local PostgreSQL Setup](#-local-postgresql-setup) (Traditional setup)
- **Option B**: [Supabase Cloud Setup](#-supabase-cloud-setup) (Recommended for beginners)

---

## 🏠 Local PostgreSQL Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Local Database
```bash
# Create database (Windows - run in Command Prompt)
createdb bb_society_db

# Or create manually in pgAdmin or psql:
# CREATE DATABASE bb_society_db;
```

### 3. Configure Environment
```bash
# Copy environment template
copy .env.example .env.local

# Edit .env.local with your local database credentials
# Example:
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/bb_society_db
```

### 4. Setup Database Tables
```bash
npm run db:migrate
```

### 5. Add Sample Data (Optional)
```bash
npm run db:seed
```

---

## ☁️ Supabase Cloud Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Get your credentials from Settings → API and Settings → Database

### 3. Configure Environment
```bash
# Copy environment template
copy .env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### 4. Setup Database Tables
```bash
npm run db:migrate:supabase
```

### 5. Add Sample Data (Optional)
```bash
npm run db:seed:supabase
```

### 6. Test Connection
```bash
npm run db:test:supabase
```

---

## 🎯 Run Application
```bash
# Development mode
npm run dev

# Open browser: http://localhost:3000
```

## 🏗️ Production Build
```bash
npm run build
npm start
```

## ❌ Common Issues

### Database Connection Error
- Check if PostgreSQL is running
- Verify credentials in .env.local
- Ensure database exists

### Port 3000 in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📱 Current Features
✅ Schools Management (Full CRUD with search, filter, profile view)
✅ Teachers Management (Full CRUD with school assignments)
✅ Students Management (Full CRUD with assessments)
✅ Lessons Management (Full CRUD with teacher assignments)
✅ Schedules Management (Full CRUD with calendar view)
✅ Assessment System (Student evaluations and feedback)
✅ Dashboard with Statistics and Analytics
✅ Responsive Design (Mobile-friendly interface)
✅ Database Support (Local PostgreSQL & Supabase Cloud)

## 🆘 Need Help?

### 📚 Documentation
- **General Setup**: Check the main README.md for detailed documentation
- **Supabase Setup**: See SUPABASE_SETUP.md for comprehensive Supabase guide
- **Environment Config**: Use .env.example as template for your .env.local

### 🔧 Available Scripts
```bash
# Local Database
npm run db:migrate          # Create tables locally
npm run db:seed             # Add sample data locally  
npm run db:test             # Test local connection

# Supabase Database  
npm run db:migrate:supabase # Create tables in Supabase
npm run db:seed:supabase    # Add sample data to Supabase
npm run db:test:supabase    # Test Supabase connection
```
