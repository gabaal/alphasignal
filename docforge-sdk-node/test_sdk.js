const { DocForge } = require('./index.js');

async function testSdk() {
  console.log('--- Testing @docforge/sdk Node.js SDK ---');

  const client = new DocForge({
    apiKey: 'df_live_test_88192301923',
    baseUrl: 'http://localhost:4000'
  });

  // 1. Healthcheck
  const health = await client.health();
  console.log('✅ Cluster Health Status:', health.status);

  // 2. Render Binary PDF
  const pdfBuffer = await client.render({
    html: '<h1>Invoice {{number}}</h1><p>Client: {{client_name}}</p>',
    css: 'h1 { color: #047857; }',
    data: { number: 'INV-SDK-2026', client_name: 'AlphaSignal SDK Integration' },
    options: { theme: 'emerald', watermark: 'PAID' },
    response_type: 'binary'
  });

  console.log('✅ PDF Rendered Successfully!');
  console.log('   Byte Length:', pdfBuffer.length);
  console.log('   Document SHA-256 Hash:', pdfBuffer.hash);
  console.log('   Render Latency:', pdfBuffer.renderTimeMs, 'ms');

  // 3. Verify Document Ledger
  const verification = await client.verify(pdfBuffer.hash);
  console.log('✅ Ledger Verification Result:', verification.is_valid ? 'AUTHENTIC & VALID' : 'INVALID');
  console.log('   Issued At:', verification.issued_at);
}

testSdk().catch(err => {
  console.error('❌ SDK Test Error:', err);
});
