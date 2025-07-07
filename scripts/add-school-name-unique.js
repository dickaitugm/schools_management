const pool = require('../lib/db');

async function addUniqueConstraintToSchoolName() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding UNIQUE constraint to school name...');

    // First, let's check for duplicate school names
    const duplicatesQuery = `
      SELECT name, COUNT(*) as count
      FROM schools
      GROUP BY name
      HAVING COUNT(*) > 1
    `;
    
    const duplicatesResult = await client.query(duplicatesQuery);
    
    if (duplicatesResult.rows.length > 0) {
      console.log('⚠️  Found duplicate school names:');
      duplicatesResult.rows.forEach(row => {
        console.log(`   - "${row.name}" (${row.count} times)`);
      });
      
      // Handle duplicates by adding numbers to make them unique
      for (const duplicate of duplicatesResult.rows) {
        const schoolName = duplicate.name;
        console.log(`🔧 Fixing duplicates for "${schoolName}"...`);
        
        // Get all schools with this name, ordered by creation date
        const schoolsQuery = `
          SELECT id, name, created_at
          FROM schools
          WHERE name = $1
          ORDER BY created_at ASC
        `;
        
        const schoolsResult = await client.query(schoolsQuery, [schoolName]);
        
        // Keep the first one as is, rename others
        for (let i = 1; i < schoolsResult.rows.length; i++) {
          const school = schoolsResult.rows[i];
          const newName = `${schoolName} (${i + 1})`;
          
          await client.query(
            'UPDATE schools SET name = $1 WHERE id = $2',
            [newName, school.id]
          );
          
          console.log(`   ✅ Renamed school ID ${school.id} to "${newName}"`);
        }
      }
    } else {
      console.log('✅ No duplicate school names found');
    }

    // Add UNIQUE constraint to school name
    try {
      await client.query(`
        ALTER TABLE schools 
        ADD CONSTRAINT schools_name_unique UNIQUE (name)
      `);
      console.log('✅ Added UNIQUE constraint to schools.name');
    } catch (error) {
      if (error.code === '42P07') {
        console.log('ℹ️  UNIQUE constraint already exists on schools.name');
      } else {
        throw error;
      }
    }

    console.log('🎉 School name uniqueness migration completed!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addUniqueConstraintToSchoolName();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addUniqueConstraintToSchoolName };
