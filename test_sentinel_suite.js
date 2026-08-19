const assert = require('assert');
const http = require('http');

const BASE_URL = 'http://localhost:4006';
let passedTests = 0;
let totalTests = 0;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const reqOptions = {
      method: options.method || 'GET',
      headers: headers
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, rawData: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, rawData: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function check(condition, message) {
  totalTests++;
  try {
    assert(condition, message);
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${message}: ${err.message}`);
    throw err;
  }
}

async function runSentinelTestSuite() {
  console.log('\n================================================================');
  console.log('⚡ STATUSSENTINEL MASTER INTEGRATION TEST SUITE');
  console.log('================================================================');
  console.log(`Target Service: ${BASE_URL}\n`);

  // STEP 1: Healthcheck
  console.log('--- Step 1: Healthcheck Endpoint ---');
  const healthRes = await request('/v1/health');
  check(healthRes.status === 200, 'GET /v1/health returns HTTP 200 OK');
  check(healthRes.data.status === 'healthy', 'Service status is "healthy"');
  check(healthRes.data.service.includes('StatusSentinel'), 'Service identifies as StatusSentinel');

  // STEP 2: Monitors List
  console.log('\n--- Step 2: List Monitors ---');
  const monitorsRes = await request('/v1/monitors');
  check(monitorsRes.status === 200, 'GET /v1/monitors returns HTTP 200 OK');
  check(Array.isArray(monitorsRes.data.data), 'Returns array of monitors');
  check(monitorsRes.data.data.length >= 1, 'Contains pre-configured seed monitors');

  // STEP 3: Create New Monitor
  console.log('\n--- Step 3: Create New Endpoint Monitor ---');
  const newMonRes = await request('/v1/monitors', {
    method: 'POST',
    body: {
      name: 'User Dashboard App',
      url: 'https://httpbin.org/status/200',
      interval_seconds: 30
    }
  });
  check(newMonRes.status === 201, 'POST /v1/monitors returns HTTP 201 Created');
  check(newMonRes.data.data.name === 'User Dashboard App', 'Monitor name set correctly');
  check(typeof newMonRes.data.data.latency_ms === 'number', 'Ping worker measured initial response latency');

  const createdId = newMonRes.data.data.id;

  // STEP 4: Hosted Status Page Telemetry
  console.log('\n--- Step 4: Hosted Status Page Config & Telemetry ---');
  const pageRes = await request('/v1/status-pages/default');
  check(pageRes.status === 200, 'GET /v1/status-pages/default returns HTTP 200 OK');
  check(pageRes.data.data.overall_status === 'ALL_SYSTEMS_OPERATIONAL', 'Overall status is ALL_SYSTEMS_OPERATIONAL');
  check(Array.isArray(pageRes.data.data.monitors), 'Contains list of page monitors');

  // STEP 5: Hosted Status Page HTML Render
  console.log('\n--- Step 5: Render Hosted Public Status Page HTML ---');
  const htmlRes = await request('/status/default');
  check(htmlRes.status === 200, 'GET /status/default returns HTTP 200 OK');
  check(htmlRes.rawData.includes('StatusSentinel'), 'HTML output contains StatusSentinel brand');
  check(htmlRes.rawData.includes('System Services Uptime'), 'HTML output renders uptime section');

  // STEP 6: Incident Management
  console.log('\n--- Step 6: Incidents API ---');
  const incidentsRes = await request('/v1/incidents');
  check(incidentsRes.status === 200, 'GET /v1/incidents returns HTTP 200 OK');
  check(Array.isArray(incidentsRes.data.data), 'Returns array of incidents');

  const createIncRes = await request('/v1/incidents', {
    method: 'POST',
    body: {
      title: 'Upstream Provider Intermittent Timeout',
      impact: 'MINOR',
      description: 'Investigating high response latency on upstream DNS providers.'
    }
  });
  check(createIncRes.status === 201, 'POST /v1/incidents creates incident report');
  check(createIncRes.data.data.status === 'INVESTIGATING', 'Incident status set to INVESTIGATING');

  // STEP 7: Discord Incident Webhook Dispatcher
  console.log('\n--- Step 7: Discord Incident Webhook Dispatcher ---');
  const alertRes = await request('/v1/alerts/discord', {
    method: 'POST',
    body: {
      webhook_url: 'https://discord.com/api/webhooks/simulator',
      monitor_id: createdId
    }
  });
  check(alertRes.status === 200, 'POST /v1/alerts/discord returns HTTP 200 OK');
  check(alertRes.data.dispatched_embed.title.includes('SYSTEM INCIDENT DETECTED'), 'Formatted rich incident embed');

  // STEP 8: Pro API Key Provisioning
  console.log('\n--- Step 8: Pro API Key Provisioning ---');
  const keyRes = await request('/v1/keys', {
    method: 'POST',
    body: { plan: 'pro', name: 'DevOps Lead' }
  });
  check(keyRes.status === 201, 'POST /v1/keys provisions new API Key');
  check(keyRes.data.key.startsWith('sentinel_live_'), 'Generated valid "sentinel_live_" key prefix');

  // STEP 9: Stripe Subscription Session Initialization
  console.log('\n--- Step 9: Stripe Subscription Checkout Session ---');
  const stripeRes = await request('/v1/checkout/create-session', {
    method: 'POST',
    body: { plan: 'pro', email: 'devops@techcorp.io' }
  });
  check(stripeRes.status === 200, 'POST /v1/checkout/create-session returns HTTP 200 OK');
  check(stripeRes.data.amount_usd === 49, 'Checkout price set to $49 USD/mo for Pro Sentinel');
  check(stripeRes.data.api_key.startsWith('sentinel_live_'), 'Provisioned API key upon Stripe session creation');

  // STEP 10: Delete Monitor Cleanup
  console.log('\n--- Step 10: Delete Monitor Cleanup ---');
  const delRes = await request(`/v1/monitors/${createdId}`, { method: 'DELETE' });
  check(delRes.status === 200, 'DELETE /v1/monitors/:id returns HTTP 200 OK');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} STATUSSENTINEL MASTER INTEGRATION TESTS PASSED!`);
  console.log('================================================================\n');
}

runSentinelTestSuite().catch(err => {
  console.error('❌ Test suite failed with error:', err);
  process.exit(1);
});
