// Test script untuk API endpoints User dan Role Management
const pool = require('../lib/db');

async function testUserRoleAPIs() {
  console.log('🧪 Testing User & Role Management APIs...\n');
  
  try {
    // Test 1: Check if users table has data
    console.log('1. Checking users table...');
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.name,
        u.role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LIMIT 5
    `);
    console.log(`   ✅ Found ${usersResult.rows.length} users`);
    usersResult.rows.forEach(user => {
      console.log(`      - ${user.name} (${user.username}) - Role: ${user.role_name || 'No role'}`);
    });
    
    // Test 2: Check roles table
    console.log('\n2. Checking roles table...');
    const rolesResult = await pool.query(`
      SELECT id, name, description, 
             jsonb_array_length(permissions) as permission_count
      FROM roles
    `);
    console.log(`   ✅ Found ${rolesResult.rows.length} roles`);
    rolesResult.rows.forEach(role => {
      console.log(`      - ${role.name}: ${role.description} (${role.permission_count} permissions)`);
    });
    
    // Test 3: Check permissions table
    console.log('\n3. Checking permissions table...');
    const permissionsResult = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM permissions
      GROUP BY category
      ORDER BY category
    `);
    console.log(`   ✅ Found permissions in ${permissionsResult.rows.length} categories`);
    permissionsResult.rows.forEach(cat => {
      console.log(`      - ${cat.category}: ${cat.count} permissions`);
    });
    
    // Test 4: Check role_permissions relationships
    console.log('\n4. Checking role-permission relationships...');
    const relationResult = await pool.query(`
      SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);
    console.log(`   ✅ Role-permission relationships:`);
    relationResult.rows.forEach(rel => {
      console.log(`      - ${rel.role_name}: ${rel.permission_count} assigned permissions`);
    });
    
    console.log('\n🎉 All database checks completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Users: ${usersResult.rows.length}`);
    console.log(`   - Roles: ${rolesResult.rows.length}`);
    console.log(`   - Permission categories: ${permissionsResult.rows.length}`);
    console.log('\n✅ Database is ready for User & Role Management system');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await pool.end();
  }
}

// Run test if script is called directly
if (require.main === module) {
  testUserRoleAPIs();
}

module.exports = testUserRoleAPIs;
