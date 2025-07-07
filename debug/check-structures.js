// Script to check table structure and identify profile API errors
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bb_society_db',
  password: 'dickaface',
  port: 5432,
});

async function checkTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking table structures...\n');
    
    // Check teachers table
    console.log('1. Teachers table structure:');
    const teachersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'teachers' 
      ORDER BY ordinal_position
    `);
    teachersStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log();
    
    // Check schools table
    console.log('2. Schools table structure:');
    const schoolsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'schools' 
      ORDER BY ordinal_position
    `);
    schoolsStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log();
    
    // Check students table
    console.log('3. Students table structure:');
    const studentsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    studentsStructure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log();
    
    // Test specific queries that might be causing errors
    console.log('4. Testing problematic queries...\n');
    
    // Test school profile query
    try {
      console.log('   Testing school profile query...');
      const schoolProfileTest = await client.query(`
        SELECT DISTINCT t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at, MIN(s.scheduled_date) as association_date
        FROM teachers t
        JOIN schedule_teachers st ON t.id = st.teacher_id
        JOIN schedules s ON st.schedule_id = s.id
        WHERE s.school_id = 1 AND s.status = 'completed'
        GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at
        ORDER BY t.name
        LIMIT 1
      `);
      console.log('   ✅ School profile query works!');
    } catch (error) {
      console.log('   ❌ School profile query error:', error.message);
    }
    
    // Test teacher profile query  
    try {
      console.log('   Testing teacher profile query...');
      const teacherProfileTest = await client.query(`
        SELECT DISTINCT s.id, s.name, s.address, s.phone, s.email, s.created_at, MIN(sch.scheduled_date) as association_date
        FROM schools s
        JOIN schedules sch ON s.id = sch.school_id
        JOIN schedule_teachers st ON sch.id = st.schedule_id
        WHERE st.teacher_id = 1 AND sch.status = 'completed'
        GROUP BY s.id, s.name, s.address, s.phone, s.email, s.created_at
        ORDER BY s.name
        LIMIT 1
      `);
      console.log('   ✅ Teacher profile query works!');
    } catch (error) {
      console.log('   ❌ Teacher profile query error:', error.message);
    }
    
    // Test student profile query
    try {
      console.log('   Testing student profile query...');
      const studentProfileTest = await client.query(`
        SELECT DISTINCT t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at, MIN(s.scheduled_date) as association_date
        FROM teachers t
        JOIN schedule_teachers st ON t.id = st.teacher_id
        JOIN schedules s ON st.schedule_id = s.id
        JOIN student_attendance sa ON s.id = sa.schedule_id
        WHERE sa.student_id = 1 AND s.status = 'completed'
        GROUP BY t.id, t.name, t.subject, t.email, t.phone, t.hire_date, t.created_at
        ORDER BY t.name
        LIMIT 1
      `);
      console.log('   ✅ Student profile query works!');
    } catch (error) {
      console.log('   ❌ Student profile query error:', error.message);
    }
    
    console.log();
    
    // Check if problematic tables exist
    console.log('5. Checking for potentially missing tables...');
    const tables = ['teacher_schools', 'student_teachers', 'lesson_teachers'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows[0].count > 0) {
          console.log(`   ✅ Table '${table}' exists`);
        } else {
          console.log(`   ⚠️  Table '${table}' does not exist`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking table '${table}':`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during structure check:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTableStructure();
