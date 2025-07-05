# Vercel Deployment Guide

## 🚀 Deployment Steps

### 1. Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
NODE_ENV=production
USE_SUPABASE=true
NODE_TLS_REJECT_UNAUTHORIZED=0
POSTGRES_URL=postgres://postgres.xhbfiwrqbjokasjvuvbl:qoah5SnJSDWqlOAn@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_URL_NON_POOLING=postgres://postgres.xhbfiwrqbjokasjvuvbl:qoah5SnJSDWqlOAn@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://xhbfiwrqbjokasjvuvbl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoYmZpd3JxYmpva2FzanZ1dmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODY5MzQsImV4cCI6MjA2NzI2MjkzNH0.7Pya046lQv3UhYBuTFdyqer1y9FH49BENch5dmWedIk
```

### 2. Important Notes

- **DO NOT** set `DATABASE_URL` for production deployment
- Always set `USE_SUPABASE=true` for production
- Make sure all Supabase credentials are correct
- Environment variables in Vercel override local `.env.local` files

### 3. Build Commands

**For Vercel (Production):**
```bash
npm run build
```

**For Local Testing:**
```bash
npm run build:local  # Uses local database
```

### 4. Database Connection Logic

The application automatically detects which database to use:

- **Production**: Always uses Supabase (when `NODE_ENV=production`)
- **Development**: Uses Supabase if `USE_SUPABASE=true`, otherwise local PostgreSQL

### 5. Troubleshooting

#### Error: `connect ECONNREFUSED 127.0.0.1:5432`
- **Cause**: Application trying to connect to local database in production
- **Solution**: Ensure environment variables are set correctly in Vercel

#### Environment Variables Not Working
- Check variable names are exactly correct (case-sensitive)
- Redeploy after adding variables
- Check Vercel deployment logs for errors

#### Database Connection Timeout
- Verify Supabase credentials are correct
- Check if Supabase project is active
- Ensure database URL format is correct

### 6. Testing Deployment

After deployment, test these endpoints:
- `/api/schools` - Should return schools from Supabase
- `/api/teachers` - Should return teachers from Supabase
- `/api/students` - Should return students from Supabase

### 7. Deployment Checklist

- [ ] Supabase database is set up and seeded
- [ ] Environment variables added to Vercel
- [ ] `vercel.json` is configured
- [ ] Application builds successfully
- [ ] API endpoints work correctly
- [ ] Frontend connects to Supabase data

### 8. Environment Variables Template for Vercel

```
NODE_ENV=production
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_DB_URL=postgresql://postgres:[your-password]@db.[your-project-id].supabase.co:5432/postgres
```

### 9. Local Development vs Production

**Local Development (with Supabase):**
```bash
# Set in .env.local
USE_SUPABASE=true
npm run dev
```

**Local Development (with PostgreSQL):**
```bash
# Set in .env.local
USE_SUPABASE=false
# or comment out USE_SUPABASE
npm run dev
```

**Production (Vercel):**
- Automatically uses Supabase when `NODE_ENV=production`
- No need to set `USE_SUPABASE` in Vercel (already in vercel.json)
