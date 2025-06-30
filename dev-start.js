const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting BB Society Information System Development Environment');
console.log('');

// Start React development server
console.log('📦 Starting React development server...');
const reactProcess = spawn('node', [
  path.join(__dirname, 'node_modules', 'react-scripts', 'scripts', 'start.js')
], {
  stdio: 'inherit',
  shell: true
});

// Wait for React server to be ready, then start Electron
setTimeout(() => {
  console.log('');
  console.log('⚡ Starting Electron application...');
  
  const electronProcess = spawn('node', [
    path.join(__dirname, 'public', 'electron.js')
  ], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    reactProcess.kill();
    process.exit(code);
  });

}, 5000);

reactProcess.on('close', (code) => {
  console.log(`React process exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  reactProcess.kill();
  process.exit();
});
