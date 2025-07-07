// Script to check and remove school_id from teachers and teacher_id from students
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bb_society_db',
  password: 'dickaface',
  port: 5432,
});

async function removeColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current table structures...\n');
    
    // Check teachers table structure
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
    
    // Check students table structure
    console.log('2. Students table structure:');
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
    
    // Check if school_id exists in teachers table
    const teacherSchoolCol = teachersStructure.rows.find(col => col.column_name === 'school_id');
    if (teacherSchoolCol) {
      console.log('3. Removing school_id from teachers table...');
      await client.query('ALTER TABLE teachers DROP COLUMN IF EXISTS school_id');
      console.log('   ✅ school_id column removed from teachers');
    } else {
      console.log('3. school_id column not found in teachers table (already removed)');
    }
    
    // Check if teacher_id exists in students table  
    const studentTeacherCol = studentsStructure.rows.find(col => col.column_name === 'teacher_id');
    if (studentTeacherCol) {
      console.log('4. Removing teacher_id from students table...');
      await client.query('ALTER TABLE students DROP COLUMN IF EXISTS teacher_id');
      console.log('   ✅ teacher_id column removed from students');
    } else {
      console.log('4. teacher_id column not found in students table (already removed)');
    }
    
    console.log();
    
    // Verify final structures
    console.log('5. Final table structures after cleanup:');
    
    console.log('   Teachers final structure:');
    const finalTeachers = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'teachers' 
      ORDER BY ordinal_position
    `);
    finalTeachers.rows.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('   Students final structure:');
    const finalStudents = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    finalStudents.rows.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n🎉 Column cleanup completed!');
    console.log('\nNext: Fix teacher profile recent schedules...');
    
  } catch (error) {
    console.error('❌ Error during column removal:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

removeColumns();
