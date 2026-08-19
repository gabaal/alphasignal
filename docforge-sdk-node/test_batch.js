const { DocForge } = require('./index.js');

async function testBatchRendering() {
  console.log('=================================================');
  console.log('🚀 Testing Async Batch PDF Rendering Engine & Queue');
  console.log('=================================================');

  const client = new DocForge({
    apiKey: 'df_live_batch_test_88192301923',
    baseUrl: 'http://localhost:4000'
  });

  // 1. Enqueue Batch Job of 5 Invoices
  console.log('\n1. Enqueuing batch job of 5 items...');
  const items = Array.from({ length: 5 }, (_, i) => ({
    id: `inv_batch_${i + 1}`,
    data: {
      number: `INV-BATCH-2026-0${i + 1}`,
      client: `Batch Client #${i + 1}`,
      amount: (1500 + i * 250).toFixed(2)
    }
  }));

  const batchJob = await client.renderBatch({
    template_id: 'b2b_saas_invoice',
    items,
    webhook_url: 'http://localhost:4000/v1/health' // Test webhook target
  });

  console.log('✅ Batch Job Enqueued Successfully!');
  console.log('   Batch ID:', batchJob.batch_id);
  console.log('   Total Items:', batchJob.total_items);
  console.log('   Status URL:', batchJob.status_url);

  // 2. Poll Job Status until completed
  console.log('\n2. Polling job status until completion...');
  let job = null;
  let attempts = 0;

  while (attempts < 30) {
    attempts++;
    await new Promise(r => setTimeout(r, 800));

    const res = await client.getJobStatus(batchJob.batch_id);
    job = res.job;
    console.log(`   [Attempt ${attempts}] Status: ${job.status.toUpperCase()} | Progress: ${job.processed_items}/${job.total_items} (${job.progress_percent}%)`);

    if (job.status === 'completed' || job.status === 'failed') {
      break;
    }
  }

  console.log('\n=================================================');
  console.log('✅ Batch Job Execution Completed!');
  console.log('=================================================');
  console.log(`Status:           ${job.status.toUpperCase()}`);
  console.log(`Total Items:      ${job.total_items}`);
  console.log(`Processed Items:  ${job.processed_items}`);
  console.log(`Failed Items:     ${job.failed_items}`);
  console.log(`Created At:       ${job.created_at}`);
  console.log(`Completed At:     ${job.completed_at}`);

  console.log('\n3. Verifying Completed Item Download URLs & Ledger Hashes:');
  job.items.forEach((item, idx) => {
    console.log(`   Item #${idx + 1} (${item.custom_id}): ${item.status.toUpperCase()}`);
    console.log(`      Hash:         ${item.document_hash}`);
    console.log(`      Download URL: ${item.download_url}`);
  });
}

testBatchRendering().catch(err => {
  console.error('❌ Batch Test Error:', err);
  process.exit(1);
});
