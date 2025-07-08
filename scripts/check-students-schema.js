const pool = require('../lib/db');

(async () => {
  try {
    console.log('=== Database Schema Information ===');
    
    // Check students table
    const studentsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    console.log('Students table columns:');
    studentsResult.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check if there's a student_assessments table
    const assessmentResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'student_assessments' 
      ORDER BY ordinal_position
    `);
    console.log('\nStudent_assessments table columns:');
    assessmentResult.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Sample data check
    const sampleStudents = await pool.query('SELECT id, name, school_id FROM students LIMIT 3');
    console.log('\nSample students:');
    sampleStudents.rows.forEach(student => {
      console.log(`  ID: ${student.id}, Name: ${student.name}, School: ${student.school_id}`);
    });
    
    // Check school and students count
    const schoolStudentCount = await pool.query(`
      SELECT 
        sch.id as school_id, 
        sch.name as school_name,
        COUNT(st.id) as total_students,
        COUNT(sa.student_id) as assessed_students
      FROM schools sch
      LEFT JOIN students st ON sch.id = st.school_id
      LEFT JOIN student_assessments sa ON st.id = sa.student_id
      GROUP BY sch.id, sch.name
      ORDER BY sch.name
      LIMIT 5
    `);
    console.log('\nSchool student counts:');
    schoolStudentCount.rows.forEach(school => {
      console.log(`  ${school.school_name}: ${school.assessed_students}/${school.total_students} students`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
