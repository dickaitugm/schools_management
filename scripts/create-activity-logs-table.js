const pool = require('../lib/db');

async function createActivityLogsTable() {
  console.log('🚀 Creating activity_logs table...');
  
  const client = await pool.connect();

  try {
    // Create activity_logs table
    const createActivityLogsTable = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await client.query(createActivityLogsTable);
    console.log('✅ activity_logs table created successfully!');

    // Create indexes for better performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role ON activity_logs(user_role);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);
    `;

    await client.query(createIndexes);
    console.log('✅ Indexes created successfully!');

    // Insert sample data for testing
    const insertSample = `
      INSERT INTO activity_logs (user_id, user_name, user_role, action, description, metadata, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await client.query(insertSample, [
      'admin',
      'Administrator',
      'admin',
      'system',
      'Activity logs table created',
      JSON.stringify({ system: true, version: '1.0' }),
      'system-init'
    ]);

    console.log('✅ Sample data inserted!');
    console.log('📊 Activity logs system ready!');

  } catch (error) {
    console.error('❌ Error creating activity_logs table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
createActivityLogsTable();
