// Test User CRUD operations
const pool = require('../lib/db');
const bcrypt = require('bcryptjs');

async function testUserCRUD() {
    console.log('🧪 Testing User CRUD Operations...\n');
    
    try {
        // Test 1: Create a test user
        console.log('1. Testing Create User...');
        const testUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            role_id: 1, // Assuming admin role exists
            is_active: true
        };
        
        // Hash password
        const password_hash = await bcrypt.hash(testUser.password, 10);
        
        const createResult = await pool.query(`
            INSERT INTO users (username, email, password_hash, name, role_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, username, email, name, role_id, is_active
        `, [testUser.username, testUser.email, password_hash, testUser.name, testUser.role_id, testUser.is_active]);
        
        console.log('   ✅ User created:', createResult.rows[0]);
        const userId = createResult.rows[0].id;
        
        // Test 2: Read user with role info
        console.log('\n2. Testing Read User with Role...');
        const readResult = await pool.query(`
            SELECT 
                u.id, u.username, u.email, u.name, u.role_id, u.is_active,
                r.name as role_name, r.description as role_description
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `, [userId]);
        
        console.log('   ✅ User with role info:', readResult.rows[0]);
        
        // Test 3: Update user
        console.log('\n3. Testing Update User...');
        const updateResult = await pool.query(`
            UPDATE users 
            SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, username, email, name, updated_at
        `, ['Updated Test User', 'updated@example.com', userId]);
        
        console.log('   ✅ User updated:', updateResult.rows[0]);
        
        // Test 4: List all users
        console.log('\n4. Testing List All Users...');
        const listResult = await pool.query(`
            SELECT 
                u.id, u.username, u.email, u.name, u.role_id, u.is_active,
                r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        
        console.log(`   ✅ Total users: ${listResult.rows.length}`);
        listResult.rows.forEach(user => {
            console.log(`      - ${user.name} (${user.username}) - Role: ${user.role_name || 'No role'}`);
        });
        
        // Test 5: Delete test user
        console.log('\n5. Testing Delete User...');
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        console.log('   ✅ Test user deleted');
        
        console.log('\n🎉 All User CRUD tests passed!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await pool.end();
    }
}

// Run test if script is called directly
if (require.main === module) {
    testUserCRUD();
}

module.exports = testUserCRUD;
