const { DocForge } = require('./index.js');

async function testTemplateWorkflow() {
  console.log('=================================================');
  console.log('🚀 Testing Server-Side Template Storage & Versioning');
  console.log('=================================================');

  const client = new DocForge({
    apiKey: 'df_live_template_test_88192301923',
    baseUrl: 'http://localhost:4000'
  });

  // 1. Create Template (v1)
  console.log('\n1. Creating Template "b2b_saas_invoice" (v1)...');
  const t1 = await client.createTemplate({
    template_id: 'b2b_saas_invoice',
    name: 'B2B SaaS Monthly Invoice',
    html: '<div style="padding:20px;"><h1>INVOICE {{invoice_number}}</h1><p>Customer: {{customer_name}}</p><p>Amount Due: ${{amount}}</p></div>',
    css: 'h1 { color: #4f46e5; font-family: sans-serif; }',
    default_options: { theme: 'emerald', watermark: 'PAID' }
  });
  console.log('✅ Created Version:', t1.template.version, '| Created At:', t1.template.created_at);

  // 2. Update Template (v2 - New Version)
  console.log('\n2. Updating Template "b2b_saas_invoice" (v2)...');
  const t2 = await client.createTemplate({
    template_id: 'b2b_saas_invoice',
    name: 'B2B SaaS Monthly Invoice (v2 Styled)',
    html: '<div style="padding:30px; border:2px solid #6366f1;"><h1>OFFICIAL INVOICE {{invoice_number}}</h1><p>Customer: <strong>{{customer_name}}</strong></p><p>Total: <strong>${{amount}}</strong></p></div>',
    css: 'h1 { color: #059669; font-family: Arial; }',
    default_options: { theme: 'emerald', watermark: 'PAID' }
  });
  console.log('✅ Created Version:', t2.template.version, '| Created At:', t2.template.created_at);

  // 3. List Templates
  console.log('\n3. Listing Registered Templates...');
  const list = await client.listTemplates();
  console.log('✅ Registered Templates Count:', list.templates.length);
  console.table(list.templates);

  // 4. Render PDF by Template ID (Latest Version)
  console.log('\n4. Rendering PDF using template_id "b2b_saas_invoice" (Latest v2)...');
  const pdfBuffer = await client.render({
    template_id: 'b2b_saas_invoice',
    data: {
      invoice_number: 'INV-2026-9901',
      customer_name: 'Acme Global AI Systems',
      amount: '4,250.00'
    },
    response_type: 'binary'
  });

  console.log('✅ Template Render Successful!');
  console.log('   Byte Length:', pdfBuffer.length);
  console.log('   Document SHA-256 Hash:', pdfBuffer.hash);
  console.log('   Render Latency:', pdfBuffer.renderTimeMs, 'ms');

  // 5. Verify Document Ledger
  console.log('\n5. Verifying Document Ledger...');
  const verifyResult = await client.verify(pdfBuffer.hash);
  console.log('✅ Verification Status:', verifyResult.is_valid ? 'AUTHENTIC & VALID' : 'INVALID');
  console.log('   Issued At:', verifyResult.issued_at);
}

testTemplateWorkflow().catch(err => {
  console.error('❌ Template Test Error:', err);
  process.exit(1);
});
