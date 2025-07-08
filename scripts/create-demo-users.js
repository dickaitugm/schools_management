// Script untuk membuat demo users di database
const pool = require('../lib/db');
const bcrypt = require('bcryptjs');

async function createDemoUsers() {
  console.log('🔧 Creating demo users for authentication testing...\n');
  
  try {
    // Demo users dengan berbagai roles
    const demoUsers = [
      {
        username: 'admin',
        email: 'admin@bbforsociety.com',
        password: 'admin123',
        name: 'Administrator',
        role_id: 1 // admin role
      },
      {
        username: 'teacher1',
        email: 'teacher1@bbforsociety.com',
        password: 'teacher123',
        name: 'John Teacher',
        role_id: 2 // teacher role
      },
      {
        username: 'staff1',
        email: 'staff1@bbforsociety.com',
        password: 'staff123',
        name: 'Sarah Staff',
        role_id: 3 // staff role
      },
      {
        username: 'viewer1',
        email: 'viewer1@bbforsociety.com',
        password: 'viewer123',
        name: 'Mike Viewer',
        role_id: 4 // viewer role
      }
    ];
    
    console.log('1. Checking existing users...');
    const existingUsers = await pool.query('SELECT username FROM users');
    const existingUsernames = existingUsers.rows.map(u => u.username);
    console.log('   Existing users:', existingUsernames);
    
    console.log('\n2. Creating demo users...');
    
    for (const userData of demoUsers) {
      // Check if user already exists
      if (existingUsernames.includes(userData.username)) {
        console.log(`   ⚠️  User '${userData.username}' already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const password_hash = await bcrypt.hash(userData.password, 10);
      
      // Insert user
      const result = await pool.query(`
        INSERT INTO users (username, email, password_hash, name, role_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username, name
      `, [
        userData.username,
        userData.email,
        password_hash,
        userData.name,
        userData.role_id,
        true
      ]);
      
      console.log(`   ✅ Created user: ${result.rows[0].name} (${result.rows[0].username})`);
    }
    
    console.log('\n3. Verifying created users with roles...');
    const usersWithRoles = await pool.query(`
      SELECT 
        u.id, u.username, u.name, u.is_active,
        r.name as role_name, r.description as role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);
    
    console.log('   Users in database:');
    usersWithRoles.rows.forEach(user => {
      console.log(`      - ${user.name} (${user.username}) - Role: ${user.role_name || 'No role'} ${user.is_active ? '✅' : '❌'}`);
    });
    
    console.log('\n🎉 Demo users setup completed!');
    console.log('\n📝 Login credentials:');
    demoUsers.forEach(user => {
      console.log(`   ${user.name}: ${user.username} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    await pool.end();
  }
}

// Run script if called directly
if (require.main === module) {
  createDemoUsers();
}

module.exports = createDemoUsers;
