# Supabase Database Setup

This document explains how to set up and use the Supabase database for the BB for Society Information System.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project in your Supabase dashboard
3. **Environment Variables**: Configure the required environment variables

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# Alternative: Individual database connection parameters
SUPABASE_DB_HOST=db.your-project-id.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password
```

### How to Get These Values

1. **Supabase URL & Anon Key**:
   - Go to your Supabase dashboard
   - Select your project
   - Go to Settings → API
   - Copy the URL and anon key

2. **Database Connection String**:
   - Go to Settings → Database
   - Under "Connection string", select "Pooler" or "Direct connection"
   - Copy the connection string and replace `[YOUR-PASSWORD]` with your actual password

## Available Scripts

### 1. Test Supabase Connection
```bash
npm run db:test:supabase
```
This script will:
- Check if all required environment variables are set
- Test the database connection
- Verify that tables exist and contain data
- Run relationship integrity checks
- Display database statistics

### 2. Migrate Database Schema
```bash
npm run db:migrate:supabase
```
This script will:
- Create all required tables in your Supabase database
- Set up foreign key relationships
- Create indexes for better performance
- Enable UUID extensions

### 3. Seed Database with Sample Data
```bash
npm run db:seed:supabase
```
This script will:
- Clear existing data (if any)
- Insert sample schools, teachers, students, lessons, and schedules
- Create relationships between entities
- Add sample assessments

## Setup Process

1. **Configure Environment Variables**
   ```bash
   # Copy the example and edit with your values
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

2. **Test Connection**
   ```bash
   npm run db:test:supabase
   ```

3. **Run Migration**
   ```bash
   npm run db:migrate:supabase
   ```

4. **Seed with Sample Data**
   ```bash
   npm run db:seed:supabase
   ```

5. **Verify Setup**
   ```bash
   npm run db:test:supabase
   ```

## Database Schema

The Supabase database includes the following tables:

### Core Tables
- **schools**: Educational institutions
- **teachers**: Teaching staff
- **students**: Student records
- **lessons**: Curriculum content
- **schedules**: Class schedules
- **assessments**: Student assessments

### Relationship Tables
- **teacher_schools**: Many-to-many relationship between teachers and schools
- **student_teachers**: Many-to-many relationship between students and teachers
- **lesson_teachers**: Many-to-many relationship between lessons and teachers
- **schedule_teachers**: Teachers assigned to schedules
- **schedule_lessons**: Lessons assigned to schedules

## Switching Between Local and Supabase

### For Development (Local Database)
```bash
npm run db:migrate    # Local migration
npm run db:seed       # Local seeding
npm run db:test       # Local testing
```

### For Production/Cloud (Supabase)
```bash
npm run db:migrate:supabase    # Supabase migration
npm run db:seed:supabase       # Supabase seeding
npm run db:test:supabase       # Supabase testing
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if your IP address is allowed in Supabase settings
   - Verify the connection string format
   - Ensure the database password is correct

2. **SSL Connection Error**
   - Make sure SSL is configured properly in the connection
   - Try adding `?sslmode=require` to your connection string

3. **Permission Denied**
   - Verify that you're using the correct database credentials
   - Check if RLS (Row Level Security) policies are blocking access

4. **Table Already Exists**
   - The migration script uses `CREATE TABLE IF NOT EXISTS`
   - You can safely run migration multiple times

### Environment Variable Issues

If you get environment variable errors:

1. Check that `.env.local` exists in the project root
2. Verify all required variables are set
3. Restart your development server after changing environment variables
4. Make sure there are no extra spaces or quotes in the values

## Security Considerations

1. **Never commit environment files**: Add `.env.local` to your `.gitignore`
2. **Use environment-specific configurations**: Different environments should have different credentials
3. **Rotate keys regularly**: Change your Supabase keys periodically
4. **Enable RLS**: Consider enabling Row Level Security for production data

## Sample Data Overview

The seed script creates:
- 5 schools (SD, SMP, SMA, TK, SMK)
- 10 teachers across various subjects
- 14 students distributed across schools
- 8 lessons focused on Christian education
- 10 scheduled classes
- 8 sample assessments

All data includes realistic relationships and is suitable for testing all application features.

## Database URL Format

The Supabase database URL should follow this format:
```
postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

Where:
- `[password]`: Your database password
- `[project-id]`: Your Supabase project ID

For pooled connections, use:
```
postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```
