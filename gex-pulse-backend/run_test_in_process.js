const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting GEX-Pulse backend server...');
const serverProc = spawn('node', ['gex_server.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Wait 1.5 seconds for server to bind port, then launch test suite
setTimeout(() => {
  console.log('\n🧪 Running Master Test Suite against active server...\n');
  const testProc = spawn('node', ['../test_gex_suite.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  testProc.on('close', (code) => {
    console.log(`\n🏁 Test suite exited with code ${code}`);
    serverProc.kill();
    process.exit(code);
  });
}, 1500);
