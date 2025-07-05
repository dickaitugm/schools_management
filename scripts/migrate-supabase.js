// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Disable SSL strict checking for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = require('../lib/db-supabase');

async function createTablesSupabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating Supabase database tables...');

    // Enable UUID extension for Supabase
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✅ UUID extension enabled');

    // Schools table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Schools table created');

    // Teachers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        hire_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Teachers table created');

    // Teacher-Schools relationship table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_schools (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(teacher_id, school_id)
      )
    `);
    console.log('✅ Teacher-Schools relationship table created');

    // Students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        grade VARCHAR(50),
        age INTEGER,
        phone VARCHAR(50),
        email VARCHAR(255),
        enrollment_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table created');

    // Student-Teachers relationship table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_teachers (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, teacher_id)
      )
    `);
    console.log('✅ Student-Teachers relationship table created');

    // Lessons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER DEFAULT 60,
        materials TEXT,
        target_grade VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Lessons table created');

    // Lesson-Teachers relationship table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_teachers (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lesson_id, teacher_id)
      )
    `);
    console.log('✅ Lesson-Teachers relationship table created');

    // Schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Schedules table created');

    // Schedule-Teachers relationship table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule_teachers (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(schedule_id, teacher_id)
      )
    `);
    console.log('✅ Schedule-Teachers relationship table created');

    // Schedule-Lessons relationship table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule_lessons (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(schedule_id, lesson_id)
      )
    `);
    console.log('✅ Schedule-Lessons relationship table created');

    // Student Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_attendance (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        attendance_status VARCHAR(20) DEFAULT 'present',
        knowledge_score INTEGER CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
        participation_score INTEGER CHECK (participation_score >= 0 AND participation_score <= 100),
        personal_development_level INTEGER CHECK (personal_development_level >= 1 AND personal_development_level <= 4),
        critical_thinking_level INTEGER CHECK (critical_thinking_level >= 1 AND critical_thinking_level <= 4),
        team_work_level INTEGER CHECK (team_work_level >= 1 AND team_work_level <= 4),
        academic_knowledge_level INTEGER CHECK (academic_knowledge_level >= 1 AND academic_knowledge_level <= 4),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(schedule_id, student_id)
      )
    `);
    console.log('✅ Student Attendance table created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
      CREATE INDEX IF NOT EXISTS idx_lessons_title ON lessons(title);
      CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
    `);
    console.log('✅ Indexes created');

    console.log('🎉 All Supabase tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating Supabase tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if script is called directly
if (require.main === module) {
  console.log('🚀 Starting Supabase migration...');
  console.log('📡 Using Supabase connection');
  
  createTablesSupabase()
    .then(() => {
      console.log('🎉 Supabase database migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Supabase migration failed:', error);
      process.exit(1);
    });
}

module.exports = createTablesSupabase;
