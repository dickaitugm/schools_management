const db = require('../lib/db');

async function createActivityLogsTable() {
  console.log('Creating activity_logs table...');
  
  try {
    // Create activity_logs table
    await db.run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'guest',
        user_name TEXT NOT NULL DEFAULT 'Guest User',
        user_role TEXT NOT NULL DEFAULT 'guest',
        action TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        session_type TEXT DEFAULT 'authenticated',
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
      ON activity_logs(user_id)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role 
      ON activity_logs(user_role)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action 
      ON activity_logs(action)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
      ON activity_logs(created_at)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_session_type 
      ON activity_logs(session_type)
    `);

    console.log('✅ Activity logs table created successfully');
    
    // Insert some sample data
    console.log('Inserting sample activity logs...');
    
    const sampleLogs = [
      {
        user_id: 'guest',
        user_name: 'Guest User',
        user_role: 'guest',
        action: 'page_access',
        description: 'Accessed dashboard page',
        session_type: 'guest'
      },
      {
        user_id: 'admin_1',
        user_name: 'System Administrator',
        user_role: 'admin',
        action: 'login',
        description: 'Admin logged into system',
        session_type: 'authenticated'
      },
      {
        user_id: 'teacher_1',
        user_name: 'John Teacher',
        user_role: 'teachers',
        action: 'create',
        description: 'Created new student record',
        metadata: JSON.stringify({ entity: 'student', entity_id: 5 }),
        session_type: 'authenticated'
      },
      {
        user_id: 'guest',
        user_name: 'Guest User',
        user_role: 'guest',
        action: 'view',
        description: 'Viewed school profile ID 1',
        metadata: JSON.stringify({ entity_type: 'schools', entity_id: 1 }),
        session_type: 'guest'
      },
      {
        user_id: 'parent_1',
        user_name: 'Bob Parent',
        user_role: 'parents',
        action: 'update',
        description: 'Updated student profile',
        metadata: JSON.stringify({ entity: 'student', entity_id: 3 }),
        session_type: 'authenticated'
      }
    ];

    for (const log of sampleLogs) {
      await db.run(`
        INSERT INTO activity_logs (
          user_id, user_name, user_role, action, description, 
          metadata, session_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || CAST(ABS(RANDOM() % 30) AS TEXT) || ' days'))
      `, [
        log.user_id,
        log.user_name,
        log.user_role,
        log.action,
        log.description,
        log.metadata || '{}',
        log.session_type
      ]);
    }

    console.log('✅ Sample activity logs inserted');

  } catch (error) {
    console.error('❌ Error creating activity_logs table:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createActivityLogsTable()
    .then(() => {
      console.log('Activity logs migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createActivityLogsTable };
