// Load environment variables
require('dotenv').config({ path: '.env.local' });

const pool = require('../lib/db-supabase');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase database connection and data...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Successfully connected to Supabase database');

    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database is responsive. Current time:', result.rows[0].current_time);

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Tables in database:', tables);

    // Check data in each table
    const expectedTables = ['schools', 'teachers', 'students', 'lessons', 'schedules', 'student_attendance', 
                           'teacher_schools', 'student_teachers', 'lesson_teachers', 'schedule_teachers', 'schedule_lessons'];
    
    console.log('\n📊 Data count in each table:');
    for (const table of expectedTables) {
      if (tables.includes(table)) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   ${table}: ${countResult.rows[0].count} records`);
        } catch (error) {
          console.log(`   ${table}: ❌ Error counting records - ${error.message}`);
        }
      } else {
        console.log(`   ${table}: ❌ Table does not exist`);
      }
    }

    // Test some specific queries
    console.log('\n🔍 Testing specific queries:');

    // Test schools with teacher count
    try {
      const schoolsResult = await client.query(`
        SELECT s.id, s.name, COUNT(ts.teacher_id) as teacher_count
        FROM schools s
        LEFT JOIN teacher_schools ts ON s.id = ts.school_id
        GROUP BY s.id, s.name
        ORDER BY s.name
        LIMIT 3
      `);
      console.log('✅ Schools with teacher count:');
      schoolsResult.rows.forEach(row => {
        console.log(`   ${row.name}: ${row.teacher_count} teachers`);
      });
    } catch (error) {
      console.log('❌ Error querying schools:', error.message);
    }

    // Test teachers with school count
    try {
      const teachersResult = await client.query(`
        SELECT t.id, t.name, t.subject, COUNT(ts.school_id) as school_count
        FROM teachers t
        LEFT JOIN teacher_schools ts ON t.id = ts.teacher_id
        GROUP BY t.id, t.name, t.subject
        ORDER BY t.name
        LIMIT 3
      `);
      console.log('✅ Teachers with school count:');
      teachersResult.rows.forEach(row => {
        console.log(`   ${row.name} (${row.subject}): ${row.school_count} schools`);
      });
    } catch (error) {
      console.log('❌ Error querying teachers:', error.message);
    }

    // Test students with assessment info
    try {
      const studentsResult = await client.query(`
        SELECT s.id, s.name, s.grade, sch.name as school_name, COUNT(sa.id) as assessment_count
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        LEFT JOIN student_attendance sa ON s.id = sa.student_id
        GROUP BY s.id, s.name, s.grade, sch.name
        ORDER BY s.name
        LIMIT 5
      `);
      console.log('✅ Students with assessment count:');
      studentsResult.rows.forEach(row => {
        console.log(`   ${row.name} (${row.grade}, ${row.school_name}): ${row.assessment_count} assessments`);
      });
    } catch (error) {
      console.log('❌ Error querying students:', error.message);
    }

    // Test recent schedules
    try {
      const schedulesResult = await client.query(`
        SELECT sc.id, sc.scheduled_date, sc.scheduled_time, sc.status, s.name as school_name
        FROM schedules sc
        JOIN schools s ON sc.school_id = s.id
        ORDER BY sc.scheduled_date DESC
        LIMIT 5
      `);
      console.log('✅ Recent schedules:');
      schedulesResult.rows.forEach(row => {
        console.log(`   ${row.scheduled_date} ${row.scheduled_time} (${row.status}) at ${row.school_name}`);
      });
    } catch (error) {
      console.log('❌ Error querying schedules:', error.message);
    }

    // Test lessons with teacher assignments
    try {
      const lessonsResult = await client.query(`
        SELECT l.id, l.title, l.target_grade, COUNT(lt.teacher_id) as teacher_count
        FROM lessons l
        LEFT JOIN lesson_teachers lt ON l.id = lt.lesson_id
        GROUP BY l.id, l.title, l.target_grade
        ORDER BY l.title
        LIMIT 5
      `);
      console.log('✅ Lessons with teacher assignments:');
      lessonsResult.rows.forEach(row => {
        console.log(`   ${row.title} (${row.target_grade}): ${row.teacher_count} teachers assigned`);
      });
    } catch (error) {
      console.log('❌ Error querying lessons:', error.message);
    }

    // Test assessments summary
    try {
      const assessmentResult = await client.query(`
        SELECT 
          COUNT(*) as total_assessments,
          ROUND(AVG(knowledge_score), 2) as average_knowledge_score,
          MIN(knowledge_score) as min_score,
          MAX(knowledge_score) as max_score
        FROM student_attendance
        WHERE knowledge_score IS NOT NULL
      `);
      if (assessmentResult.rows[0].total_assessments > 0) {
        const stats = assessmentResult.rows[0];
        console.log('✅ Assessment statistics:');
        console.log(`   Total assessments: ${stats.total_assessments}`);
        console.log(`   Average knowledge score: ${stats.average_knowledge_score}`);
        console.log(`   Score range: ${stats.min_score} - ${stats.max_score}`);
      } else {
        console.log('ℹ️  No assessments found in database');
      }
    } catch (error) {
      console.log('❌ Error querying assessments:', error.message);
    }

    // Test foreign key relationships
    console.log('\n🔗 Testing foreign key relationships:');
    
    const relationshipTests = [
      { name: 'Teacher-Schools', query: 'SELECT COUNT(*) as count FROM teacher_schools ts JOIN teachers t ON ts.teacher_id = t.id JOIN schools s ON ts.school_id = s.id' },
      { name: 'Student-Teachers', query: 'SELECT COUNT(*) as count FROM student_teachers st JOIN students s ON st.student_id = s.id JOIN teachers t ON st.teacher_id = t.id' },
      { name: 'Lesson-Teachers', query: 'SELECT COUNT(*) as count FROM lesson_teachers lt JOIN lessons l ON lt.lesson_id = l.id JOIN teachers t ON lt.teacher_id = t.id' },
      { name: 'Schedule-Teachers', query: 'SELECT COUNT(*) as count FROM schedule_teachers st JOIN schedules s ON st.schedule_id = s.id JOIN teachers t ON st.teacher_id = t.id' },
      { name: 'Schedule-Lessons', query: 'SELECT COUNT(*) as count FROM schedule_lessons sl JOIN schedules s ON sl.schedule_id = s.id JOIN lessons l ON sl.lesson_id = l.id' }
    ];

    for (const test of relationshipTests) {
      try {
        const result = await client.query(test.query);
        console.log(`   ${test.name}: ${result.rows[0].count} valid relationships`);
      } catch (error) {
        console.log(`   ${test.name}: ❌ Error - ${error.message}`);
      }
    }

    console.log('\n🎉 Supabase database test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Supabase database:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('\n🔧 Checking Supabase environment variables:');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_DB_URL'
  ];

  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
    } else {
      console.log(`   ❌ ${varName}: Not set`);
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log('\n⚠️  Missing environment variables. Please set the following:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\nExample .env.local file:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
    console.log('   SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres');
    return false;
  }

  return true;
}

// Run test if script is called directly
if (require.main === module) {
  console.log('🧪 Starting Supabase Database Test\n');

  if (testEnvironmentVariables()) {
    testSupabaseConnection()
      .then(() => {
        console.log('\n✨ All tests passed! Supabase database is working correctly.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Test failed:', error.message);
        process.exit(1);
      });
  } else {
    console.log('\n💥 Environment variables test failed. Please configure Supabase environment variables.');
    process.exit(1);
  }
}

module.exports = { testSupabaseConnection, testEnvironmentVariables };
