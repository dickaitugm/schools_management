const fs = require('fs');
const path = require('path');
const os = require('os');

// Get app data path
const getAppDataPath = () => {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  switch (platform) {
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', 'bb-society-information-system');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'bb-society-information-system');
    case 'linux':
      return path.join(homeDir, '.config', 'bb-society-information-system');
    default:
      return path.join(homeDir, '.bb-society-information-system');
  }
};

const dbPath = path.join(getAppDataPath(), 'school_management.db');
const backupDir = path.join(__dirname, 'database-backups');

console.log('=== Database Restore Utility ===');

// List available backups
if (!fs.existsSync(backupDir)) {
  console.log('❌ No backup directory found. Run backup-database.js first.');
  process.exit(1);
}

const backupFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.db'));
if (backupFiles.length === 0) {
  console.log('❌ No backup files found in:', backupDir);
  process.exit(1);
}

console.log('📁 Available backups:');
backupFiles.forEach((file, index) => {
  const filePath = path.join(backupDir, file);
  const stats = fs.statSync(filePath);
  console.log(`${index + 1}. ${file}`);
  console.log(`   Size: ${stats.size} bytes`);
  console.log(`   Date: ${stats.mtime.toLocaleString()}`);
  console.log('');
});

// Get backup file to restore (you can modify this to accept command line args)
const backupToRestore = process.argv[2];
if (!backupToRestore) {
  console.log('Usage: node restore-database.js <backup-filename>');
  console.log('Example: node restore-database.js school_management_backup_2024-01-15T10-30-00-000Z.db');
  process.exit(1);
}

const backupPath = path.join(backupDir, backupToRestore);
if (!fs.existsSync(backupPath)) {
  console.log('❌ Backup file not found:', backupPath);
  process.exit(1);
}

// Create app data directory if it doesn't exist
const appDataDir = getAppDataPath();
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
  console.log('Created app data directory:', appDataDir);
}

// Restore database
try {
  if (fs.existsSync(dbPath)) {
    // Backup current database before restoring
    const currentBackupPath = path.join(backupDir, `current_backup_${Date.now()}.db`);
    fs.copyFileSync(dbPath, currentBackupPath);
    console.log('🔄 Current database backed up to:', currentBackupPath);
  }
  
  fs.copyFileSync(backupPath, dbPath);
  console.log('✅ Database restored successfully!');
  console.log('Restored from:', backupPath);
  console.log('Restored to:', dbPath);
  
  const stats = fs.statSync(dbPath);
  console.log('Database size:', stats.size, 'bytes');
  
} catch (error) {
  console.error('❌ Error restoring database:', error.message);
}
