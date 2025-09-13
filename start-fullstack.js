const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Grocify Full-Stack Application...\n');

// Start Backend
console.log('📡 Starting Backend Server...');
const backend = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment for backend to start, then start frontend
setTimeout(() => {
  console.log('\n🎨 Starting Frontend Server...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (error) => {
    console.error('❌ Frontend Error:', error);
  });
}, 2000);

backend.on('error', (error) => {
  console.error('❌ Backend Error:', error);
});

console.log('\n✅ Full-stack application starting...');
console.log('🌐 Frontend will be available at: http://localhost:3000');
console.log('🔧 Backend will be available at: http://localhost:5000');
console.log('\nPress Ctrl+C to stop both servers');


