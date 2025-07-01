const fs = require('fs');
const path = require('path');
const os = require('os');

// Simulate electron app path for backup utility
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
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `school_management_backup_${timestamp}.db`);

console.log('=== Database Backup Utility ===');
console.log('Expected database path:', dbPath);
console.log('Database exists:', fs.existsSync(dbPath));

if (fs.existsSync(dbPath)) {
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('Created backup directory:', backupDir);
  }

  // Copy database file
  try {
    fs.copyFileSync(dbPath, backupPath);
    const stats = fs.statSync(backupPath);
    console.log('✅ Backup created successfully!');
    console.log('Backup location:', backupPath);
    console.log('Backup size:', stats.size, 'bytes');
    console.log('Backup date:', stats.mtime.toLocaleString());
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
  }
} else {
  console.log('❌ Database file not found at expected location.');
  console.log('');
  console.log('🔍 Try these steps:');
  console.log('1. Run your Electron app first to create the database');
  console.log('2. Check if the database is in a different location');
  console.log('3. Look for .db files in your system:');
  console.log('   Windows: Search for "*.db" in %APPDATA%');
  console.log('   Or check in your project folder');
}

// Also check project folder for any db files
console.log('');
console.log('🔍 Checking project folder for database files:');
const projectFiles = fs.readdirSync(__dirname);
const dbFiles = projectFiles.filter(file => file.endsWith('.db'));
if (dbFiles.length > 0) {
  console.log('Found .db files in project:', dbFiles);
} else {
  console.log('No .db files found in project folder');
}
