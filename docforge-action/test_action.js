const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Testing GitHub Action Runner (docforge-action) ---');

const outputPath = path.join(__dirname, 'test_output.pdf');
if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

const env = {
  ...process.env,
  INPUT_API_KEY: 'df_live_gh_action_key_991823',
  INPUT_HTML: '<h1>GitHub Action CI Build</h1><p>Automated PDF generation test in GitHub Actions pipeline.</p>',
  INPUT_DATA: JSON.stringify({ build_id: 'GH-991' }),
  INPUT_OUTPUT_PATH: outputPath,
  INPUT_SERVER_URL: 'http://localhost:4000'
};

try {
  execSync('node docforge-action/index.js', { env, stdio: 'inherit' });
  
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
    console.log(`✅ GitHub Action runner successfully generated PDF artifact (${fs.statSync(outputPath).size} bytes) at ${outputPath}`);
  } else {
    console.error('❌ Failed: PDF artifact was not created or has 0 bytes.');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ GitHub Action Integration Test Exception:', err.message);
  process.exit(1);
}
