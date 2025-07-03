const pool = require('../lib/db');

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating database tables...');

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

    // Student Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_attendance (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        attendance_status VARCHAR(20) DEFAULT 'present',
        knowledge_score INTEGER CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
        participation_score INTEGER CHECK (participation_score >= 0 AND participation_score <= 100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(schedule_id, student_id)
      )
    `);

    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if script is called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Database migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createTables;
