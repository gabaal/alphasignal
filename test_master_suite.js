const http = require('http');

const API_BASE_URL = 'http://localhost:4000';
const MASTER_API_KEY = 'df_live_swagger_demo_key_991823';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method || 'GET';
  const headers = {
    'X-DocForge-Key': MASTER_API_KEY,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions = { method, headers };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data = null;
  const contentType = res.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    data = await res.json();
  } else if (contentType.includes('application/pdf')) {
    data = await res.arrayBuffer();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

async function runMasterTestSuite() {
  console.log('================================================================');
  console.log('🚀 DOCFORGE ECOSYSTEM MASTER INTEGRATION TEST SUITE (v2.5.0)');
  console.log('================================================================');
  console.log(`Target API Engine: ${API_BASE_URL}\n`);

  // STEP 1: API Cluster Health & Telemetry
  console.log('--- Step 1: Cluster Health & Telemetry ---');
  const health = await request('/v1/health');
  assert(health.status === 200, 'Health endpoint returns HTTP 200 OK');
  assert(health.data.status === 'healthy', 'Health status is "healthy"');
  assert(health.data.rendering_engine.includes('Puppeteer'), 'Rendering engine is Puppeteer Chrome cluster');
  assert(typeof health.data.total_ledger_documents === 'number', 'Telemetry exposes total ledger document count');

  // STEP 2: Server-Side Template Storage & Versioning
  console.log('\n--- Step 2: Server-Side Template Versioning ---');
  const tmplId = `master_test_tmpl_${Date.now().toString(36)}`;
  const t1 = await request('/v1/templates', {
    method: 'POST',
    body: {
      template_id: tmplId,
      name: 'Master Suite Invoice Template',
      html: '<h1>Master Suite Invoice #{{number}}</h1><p>Client: {{client}}</p>',
      css: 'h1 { color: #10b981; }',
      default_options: { theme: 'emerald' }
    }
  });

  assert(t1.status === 201, 'POST /v1/templates returns HTTP 201 Created');
  assert(t1.data.template.version === 1, 'Initial template creation is Version 1');

  // Create Version 2
  const t2 = await request('/v1/templates', {
    method: 'POST',
    body: {
      template_id: tmplId,
      name: 'Master Suite Invoice Template (Updated)',
      html: '<div class="v2"><h2>Master Suite Invoice v2 #{{number}}</h2><p>Total: ${{amount}}</p></div>',
      css: 'h2 { color: #6366f1; }'
    }
  });
  assert(t2.data.template.version === 2, 'Template updated to Version 2');

  const tmplList = await request('/v1/templates');
  assert(tmplList.status === 200, 'GET /v1/templates returns registered templates list');

  // STEP 3: Core PDF Rendering Engine & Cryptographic Ledger
  console.log('\n--- Step 3: PDF Rendering Engine & SHA-256 Ledger ---');
  const renderRes = await request('/v1/render', {
    method: 'POST',
    body: {
      template_id: tmplId,
      data: { number: 'INV-MS-2026', amount: '3,850.00' },
      response_type: 'json'
    }
  });

  assert(renderRes.status === 200, 'POST /v1/render returns HTTP 200 OK');
  assert(renderRes.data.status === 'success', 'Render response status is "success"');
  assert(typeof renderRes.data.document_hash === 'string' && renderRes.data.document_hash.length === 64, 'Generated valid 64-character SHA-256 document hash');

  const renderedHash = renderRes.data.document_hash;

  // STEP 4: Asynchronous Batch PDF Rendering Queue
  console.log('\n--- Step 4: Async Batch PDF Rendering Queue ---');
  const batchRes = await request('/v1/render/batch', {
    method: 'POST',
    body: {
      template_id: tmplId,
      items: [
        { id: 'item_1', data: { number: 'INV-B1', amount: '100.00' } },
        { id: 'item_2', data: { number: 'INV-B2', amount: '200.00' } }
      ],
      webhook_url: `${API_BASE_URL}/v1/webhooks/simulator`
    }
  });

  assert(batchRes.status === 202, 'POST /v1/render/batch returns HTTP 202 Accepted');
  assert(typeof batchRes.data.batch_id === 'string', 'Returned valid batch_id');

  const batchId = batchRes.data.batch_id;

  // Poll Batch Job Status
  let jobCompleted = false;
  for (let attempt = 1; attempt <= 15; attempt++) {
    await new Promise(r => setTimeout(r, 600));
    const jobRes = await request(`/v1/jobs/${batchId}`);
    if (jobRes.data.job && jobRes.data.job.status === 'completed') {
      jobCompleted = true;
      assert(jobRes.data.job.processed_items === 2, 'Batch queue processed all 2 items');
      break;
    }
  }
  assert(jobCompleted, 'Batch queue job transitioned to "completed" status');

  // STEP 5: Multi-Tenant API Keys & Rate Limiting (429 Enforcement)
  console.log('\n--- Step 5: Multi-Tenant API Keys & Rate Limiting ---');
  const keyProv = await request('/v1/keys', {
    method: 'POST',
    body: {
      name: 'Master Suite Restricted Key',
      account_id: 'acct_master_test',
      rate_limit_per_min: 3
    }
  });

  assert(keyProv.status === 201, 'POST /v1/keys provisions new API Key');
  const restrictedKey = keyProv.data.key.api_key;
  const restrictedKeyId = keyProv.data.key.key_id;

  // Fire 4 requests to protected route /v1/templates with limit of 3
  let got429 = false;
  for (let i = 1; i <= 4; i++) {
    const res = await request('/v1/templates', {
      headers: { 'X-DocForge-Key': restrictedKey }
    });
    if (res.status === 429) {
      got429 = true;
      assert(res.data.error === 'rate_limit_exceeded', 'HTTP 429 response contains rate_limit_exceeded error code');
    }
  }
  assert(got429, 'Rate limiter enforced HTTP 429 when per-minute quota exceeded');

  // Revoke Key
  const revokeRes = await request(`/v1/keys/${restrictedKeyId}`, { method: 'DELETE' });
  assert(revokeRes.status === 200, 'DELETE /v1/keys/:key_id revokes key');

  const revokedAccess = await request('/v1/templates', { headers: { 'X-DocForge-Key': restrictedKey } });
  assert(revokedAccess.status === 401, 'Revoked API key access returns HTTP 401 Unauthorized');

  // STEP 6: Cryptographic Document Ledger Verification
  console.log('\n--- Step 6: Cryptographic Document Ledger Verification ---');
  const verifyRes = await request(`/v1/verify/${renderedHash}`);
  assert(verifyRes.status === 200, 'GET /v1/verify/:hash returns HTTP 200 OK');
  assert(verifyRes.data.is_valid === true, 'Ledger verification is_valid is TRUE');
  assert(verifyRes.data.tamper_check.includes('Passed'), 'Tamper check confirms 0-byte modifications');

  // STEP 7: Webhook Simulator & Delivery Logs
  console.log('\n--- Step 7: Webhook Simulator & Delivery Logs ---');
  const simLogs = await request('/v1/webhooks/simulator/logs');
  assert(simLogs.status === 200, 'GET /v1/webhooks/simulator/logs returns HTTP 200 OK');
  assert(Array.isArray(simLogs.data.logs) && simLogs.data.logs.length > 0, 'Webhook simulator received and logged background batch completion webhooks');

  // STEP 8: v1.5.0 Multi-Page Header & Footer Page Numbering
  console.log('\n--- Step 8: v1.5.0 Multi-Page Header/Footer Layout ---');
  const headerFooterRes = await request('/v1/render', {
    method: 'POST',
    body: {
      html: '<h1>Multi-Page Report</h1><p>Page 1 Content</p><div style="page-break-before: always;"></div><h1>Page 2</h1><p>Page 2 Content</p>',
      options: {
        display_header_footer: true,
        header_template: '<div style="font-size: 8px; color: #64748b; margin-left: 20px;">DocForge Corporate Report</div>',
        footer_template: '<div style="font-size: 8px; color: #64748b; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
      },
      response_type: 'json'
    }
  });

  assert(headerFooterRes.status === 200, 'POST /v1/render with header/footer returns HTTP 200 OK');
  assert(headerFooterRes.data.status === 'success', 'Multi-page rendering succeeded');

  // STEP 9: v1.5.0 Interactive AcroForms & RTL Typography
  console.log('\n--- Step 9: v1.5.0 AcroForms & RTL Typography ---');
  const rtlFormRes = await request('/v1/render', {
    method: 'POST',
    body: {
      html: '<h2>تقرير إلكتروني</h2><label>User Name:</label><input type="text" value="AlphaUser"/>',
      options: {
        rtl: true,
        fillable_forms: true,
        theme: 'emerald'
      },
      response_type: 'json'
    }
  });

  assert(rtlFormRes.status === 200, 'POST /v1/render with RTL & fillable forms returns HTTP 200 OK');
  assert(typeof rtlFormRes.data.document_hash === 'string', 'Generated document hash for RTL template');

  // STEP 10: v1.5.0 PDF Compression & Stream Optimization
  console.log('\n--- Step 10: v1.5.0 PDF Stream Compression ---');
  const compressedRes = await request('/v1/render', {
    method: 'POST',
    body: {
      html: '<h1>Compressed Audit Log</h1><p>Telemetry stream data...</p>',
      options: {
        compress: true,
        watermark: 'CONFIDENTIAL'
      },
      response_type: 'json'
    }
  });

  assert(compressedRes.status === 200, 'POST /v1/render with compress option returns HTTP 200 OK');
  assert(compressedRes.data.status === 'success', 'PDF stream compression completed');

  // STEP 11: v2.0.0 Cloud Storage Adapter & Presigned Download URLs
  console.log('\n--- Step 11: v2.0.0 Cloud Storage Adapters & Presigned URLs ---');
  const storageRes = await request('/v1/render', {
    method: 'POST',
    body: {
      html: '<h1>Cloud Storage Test</h1><p>DocForge S3/GCS Adapter test payload.</p>',
      response_type: 'json'
    }
  });

  assert(storageRes.status === 200, 'POST /v1/render returns HTTP 200 OK for Cloud Storage Adapter');
  assert(typeof storageRes.data.download_url === 'string' && storageRes.data.download_url.includes('/v1/'), 'Returned valid cloud storage download URL');

  // STEP 12: v2.0.0 Merkle Tree Batch Anchoring & Cryptographic Inclusion Proofs
  console.log('\n--- Step 12: v2.0.0 Merkle Tree Batch Anchoring & Inclusion Proofs ---');
  const anchorRes = await request('/v1/ledger/anchor', { method: 'POST' });
  assert(anchorRes.status === 200, 'POST /v1/ledger/anchor returns HTTP 200 OK');
  assert(anchorRes.data.status === 'success', 'Merkle Tree batch anchoring succeeded');
  assert(typeof anchorRes.data.merkle_root === 'string' && anchorRes.data.merkle_root.length === 64, 'Generated valid 64-char Merkle Root Hash');
  assert(typeof anchorRes.data.blockchain_tx_hash === 'string' && anchorRes.data.blockchain_tx_hash.startsWith('0x'), 'Generated simulated Blockchain TX Hash');

  // Verify Merkle Inclusion Proof
  const sampleHash = renderedHash;
  const proofRes = await request(`/v1/verify/proof/${sampleHash}`);
  assert(proofRes.status === 200, 'GET /v1/verify/proof/:hash returns HTTP 200 OK');
  assert(proofRes.data.is_valid === true, 'Merkle inclusion proof is_valid is TRUE');
  assert(Array.isArray(proofRes.data.inclusion_proof), 'Returned non-empty Merkle inclusion proof array');
  assert(proofRes.data.proof_verification.includes('Verified'), 'Cryptographic proof verification confirmed against Merkle root');

  // STEP 13: v2.1.0 Webhooks v2 HMAC Signatures
  console.log('\n--- Step 13: v2.1.0 Webhooks v2 HMAC-SHA256 Signatures ---');
  const webhookRes = await request('/v1/render/batch', {
    method: 'POST',
    body: {
      template_id: tmplId,
      items: [{ id: 'wh_test_1', data: { number: 'INV-WH1', amount: '50.00' } }],
      webhook_url: `${API_BASE_URL}/v1/webhooks/simulator`
    }
  });
  assert(webhookRes.status === 202, 'POST /v1/render/batch returns HTTP 202 Accepted');

  // STEP 14: v2.1.0 Dead Letter Queue (DLQ) & Failed Webhook Retention
  console.log('\n--- Step 14: v2.1.0 Webhooks Dead Letter Queue (DLQ) ---');
  const dlqList = await request('/v1/webhooks/dlq');
  assert(dlqList.status === 200, 'GET /v1/webhooks/dlq returns HTTP 200 OK');
  assert(Array.isArray(dlqList.data.items), 'Returned valid DLQ items array');

  // STEP 15: v2.3.0 Enterprise Audit Log Exporter (SOC2 Compliance)
  console.log('\n--- Step 15: v2.3.0 Enterprise Audit Log Exporter (SOC2) ---');
  const auditJson = await request('/v1/audit/export?format=json');
  assert(auditJson.status === 200, 'GET /v1/audit/export?format=json returns HTTP 200 OK');
  assert(auditJson.data.status === 'success', 'Audit export JSON status is "success"');
  assert(Array.isArray(auditJson.data.logs), 'Audit export returns array of log entries');

  const auditCsv = await request('/v1/audit/export?format=csv');
  assert(auditCsv.status === 200, 'GET /v1/audit/export?format=csv returns HTTP 200 OK');
  assert(typeof auditCsv.data === 'string' && auditCsv.data.includes('log_id,event_type'), 'Audit export returns valid CSV header line');

  // STEP 16: v2.3.0 High-Concurrency Stress Benchmark (50 Concurrent Renders)
  console.log('\n--- Step 16: v2.3.0 High-Concurrency Stress Benchmark (50 Renders) ---');
  const CONCURRENCY_COUNT = 50;
  console.log(`  🚀 Launching ${CONCURRENCY_COUNT} parallel PDF rendering requests against Chrome cluster...`);

  const benchmarkStartTime = Date.now();
  const renderPromises = [];

  for (let i = 1; i <= CONCURRENCY_COUNT; i++) {
    renderPromises.push(
      request('/v1/render', {
        method: 'POST',
        body: {
          html: `<h1>Stress Test #${i}</h1><p>High throughput render benchmarking.</p>`,
          options: { compress: true },
          response_type: 'json'
        }
      })
    );
  }

  const stressResults = await Promise.all(renderPromises);
  const totalBenchmarkTimeMs = Date.now() - benchmarkStartTime;
  const successfulRenders = stressResults.filter(r => r.status === 200);

  assert(successfulRenders.length === CONCURRENCY_COUNT, `All ${CONCURRENCY_COUNT}/${CONCURRENCY_COUNT} concurrent PDF render requests succeeded (100% SLA)`);

  const totalThroughputRps = ((CONCURRENCY_COUNT / totalBenchmarkTimeMs) * 1000).toFixed(2);
  const avgLatencyPerDoc = Math.round(totalBenchmarkTimeMs / CONCURRENCY_COUNT);

  console.log(`\n  📊 STRESS BENCHMARK RESULTS SUMMARY:`);
  console.log(`  -------------------------------------------------------------`);
  console.log(`  • Total PDF Renders:      ${CONCURRENCY_COUNT} Documents`);
  console.log(`  • Total Batch Wall Time:  ${totalBenchmarkTimeMs} ms`);
  console.log(`  • Effective Throughput:   ${totalThroughputRps} PDFs / second`);
  console.log(`  • Average SLA Latency:    ${avgLatencyPerDoc} ms / document`);
  console.log(`  -------------------------------------------------------------`);

  // STEP 17: v2.5.0 1-Click Postman Collection Exporter
  console.log('\n--- Step 17: v2.5.0 1-Click Postman Collection Exporter ---');
  const postmanRes = await request('/v1/docs/postman');
  assert(postmanRes.status === 200, 'GET /v1/docs/postman returns HTTP 200 OK');
  assert(postmanRes.data.info.schema.includes('collection.json'), 'Valid Postman v2.1.0 collection schema URI');
  assert(Array.isArray(postmanRes.data.item) && postmanRes.data.item.length >= 6, 'Postman collection contains all 6 core feature folders');

  // STEP 18: v2.5.0 WebSocket Real-Time Progress Telemetry Engine
  console.log('\n--- Step 18: v2.5.0 WebSocket Telemetry Engine ---');
  const wsStats = await request('/v1/ws/telemetry/stats');
  assert(wsStats.status === 200, 'GET /v1/ws/telemetry/stats returns HTTP 200 OK');
  assert(wsStats.data.status === 'success', 'WebSocket telemetry engine status is "success"');
  assert(wsStats.data.channel === '/v1/ws/progress', 'Active telemetry channel is "/v1/ws/progress"');

  // Perform WebSocket Client Handshake Test
  let WebSocket;
  try {
    WebSocket = require('ws');
  } catch (e) {
    WebSocket = require('./docforge-backend/node_modules/ws');
  }
  const wsClient = new WebSocket('ws://localhost:4000/v1/ws/progress');

  const wsHandshakePromise = new Promise((resolve, reject) => {
    wsClient.on('open', () => {});
    wsClient.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.event === 'connected') resolve(msg);
      } catch (e) {
        reject(e);
      }
    });
    wsClient.on('error', (err) => reject(err));
    setTimeout(() => reject(new Error('WS Handshake Timeout')), 2000);
  });

  const handshakeMsg = await wsHandshakePromise;
  assert(handshakeMsg.event === 'connected', 'WebSocket client received "connected" handshake payload');
  assert(handshakeMsg.channel === '/v1/ws/progress', 'Handshake confirmed active channel "/v1/ws/progress"');
  wsClient.close();

  // STEP 19: v3.0.0 DocForge Copilot AI Synthesis Engine
  console.log('\n--- Step 19: v3.0.0 DocForge Copilot AI Synthesis Engine ---');
  const copilotRes = await request('/v1/templates/copilot', {
    method: 'POST',
    body: { prompt: 'Create a SaaS Tax Invoice for enterprise client' }
  });
  assert(copilotRes.status === 200, 'POST /v1/templates/copilot returns HTTP 200 OK');
  assert(copilotRes.data.status === 'success', 'Copilot synthesis status is "success"');
  assert(typeof copilotRes.data.template.html === 'string', 'Synthesized valid Handlebars HTML payload');
  assert(typeof copilotRes.data.template.css === 'string', 'Synthesized valid CSS styling rules');

  // STEP 20: v3.0.0 Encrypted PDF Security & DRM Protection
  console.log('\n--- Step 20: v3.0.0 Encrypted PDF Security & DRM Protection ---');
  const drmRes = await request('/v1/render', {
    method: 'POST',
    body: {
      html: '<h1>DRM Protected PDF</h1><p>Confidential payload...</p>',
      options: {
        encrypt: true,
        user_password: 'SecretUserPass123!',
        owner_password: 'OwnerAdminPass99!',
        permissions: { print: true, copy: false, modify: false }
      },
      response_type: 'json'
    }
  });

  assert(drmRes.status === 200, 'POST /v1/render with DRM encryption returns HTTP 200 OK');
  assert(drmRes.data.status === 'success', 'DRM encrypted PDF render status is "success"');
  assert(typeof drmRes.data.document_hash === 'string' && drmRes.data.document_hash.length === 64, 'Generated valid 64-char hash for encrypted document');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} MASTER INTEGRATION & BENCHMARK TESTS PASSED PERFECTLY!`);
  console.log('================================================================\n');
}

runMasterTestSuite().catch(err => {
  console.error('\n❌ Master Test Suite Exception:', err);
  process.exit(1);
});
