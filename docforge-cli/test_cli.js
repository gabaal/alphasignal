const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const output = execSync(cmd, { cwd: __dirname, encoding: 'utf8' });
  console.log(output);
  return output;
}

async function testCli() {
  console.log('=================================================');
  console.log('🚀 Testing docforge-cli Execution Suite');
  console.log('=================================================');

  // 1. Health Command
  console.log('\n[1] Testing "docforge health"...');
  run('node bin/docforge.js health');

  // Create dummy test template and json data
  const htmlPath = path.join(__dirname, 'test_sample.html');
  const jsonPath = path.join(__dirname, 'test_sample.json');
  const pdfOutPath = path.join(__dirname, 'test_cli_output.pdf');

  fs.writeFileSync(htmlPath, '<div style="padding:30px;"><h1>CLI TEST INVOICE #{{inv_id}}</h1><p>Client: {{client}}</p></div>');
  fs.writeFileSync(jsonPath, JSON.stringify({ inv_id: 'CLI-2026-99', client: 'DocForge CLI User' }));

  // 2. Render Command (Local File)
  console.log('\n[2] Testing "docforge render"...');
  const renderOut = run(`node bin/docforge.js render ${htmlPath} --data ${jsonPath} --out ${pdfOutPath} --theme emerald --watermark SAMPLE`);

  if (!fs.existsSync(pdfOutPath)) {
    throw new Error('PDF output file was not created!');
  }
  console.log('✅ Local File PDF Rendered Successfully!');

  // Extract hash from render log output
  const hashMatch = renderOut.match(/SHA-256 Hash:\s+([a-f0-9]{64})/);
  const hash = hashMatch ? hashMatch[1] : null;

  // 3. Verify Command
  if (hash) {
    console.log('\n[3] Testing "docforge verify <hash>"...');
    run(`node bin/docforge.js verify ${hash}`);
  }

  // 4. Template Push Command
  console.log('\n[4] Testing "docforge template push"...');
  run(`node bin/docforge.js template push cli_invoice_template ${htmlPath} --name "CLI Invoice Layout"`);

  // 5. Template List Command
  console.log('\n[5] Testing "docforge template list"...');
  run('node bin/docforge.js template list');

  // 6. Render Command via --template-id
  console.log('\n[6] Testing "docforge render --template-id"...');
  run(`node bin/docforge.js render --template-id cli_invoice_template --data ${jsonPath} --out test_cli_template_output.pdf`);

  console.log('\n=================================================');
  console.log('🎉 ALL docforge-cli SUITE TESTS PASSED PERFECTLY!');
  console.log('=================================================');
}

testCli().catch(err => {
  console.error('❌ CLI Test Error:', err.message);
  process.exit(1);
});
