# 🚀 Quick Setup Guide for BB Society Information System

## 📋 Prerequisites
1. Install Node.js (v18+): https://nodejs.org/
2. Install PostgreSQL (v12+): https://www.postgresql.org/download/

## ⚡ Quick Installation (5 steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Create database (Windows - run in Command Prompt)
createdb bb_society_db

# Or create manually in pgAdmin or psql:
# CREATE DATABASE bb_society_db;
```

### 3. Configure Environment
```bash
# Copy environment template
copy .env.local.example .env.local

# Edit .env.local with your database credentials
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
✅ Schools Management (Full CRUD)
✅ Dashboard with Statistics
⏳ Teachers (Coming Soon)
⏳ Students (Coming Soon)
⏳ Lessons (Coming Soon)
⏳ Schedules (Coming Soon)

## 🆘 Need Help?
Check the main README.md for detailed documentation.
