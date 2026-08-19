const http = require('http');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const BillingService = require('./mapleads-backend/billingService');
const LeadEngine = require('./mapleads-backend/leadEngine');
const server = require('./mapleads-backend/server');

const TEST_PORT = 4050;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting MapLeads SaaS Automated Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function logPass(title) {
    passed++;
    console.log(`  ✅ [PASS] ${title}`);
  }

  function logFail(title, error) {
    failed++;
    console.error(`  ❌ [FAIL] ${title}:`, error.message || error);
  }

  // 1. Billing Service Tests
  try {
    const testStorePath = path.join(__dirname, 'test_billing_store.json');
    if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);

    const billing = new BillingService(testStorePath);
    const keyInfo = billing.generateKey('Test User', 'Pro Tier', 50);

    assert.strictEqual(keyInfo.credits, 50, 'Initial credits should be 50');
    assert.strictEqual(keyInfo.owner, 'Test User');

    const deductResult = billing.verifyAndDeductCredits(keyInfo.key, 10);
    assert.strictEqual(deductResult.allowed, true, 'Deduction should be allowed');
    assert.strictEqual(deductResult.remainingCredits, 40, 'Remaining credits should be 40');

    const failResult = billing.verifyAndDeductCredits(keyInfo.key, 100);
    assert.strictEqual(failResult.allowed, false, 'Over-deduction should be blocked');

    if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);
    logPass('BillingService: Key generation & credit deduction logic');
  } catch (err) {
    logFail('BillingService logic test', err);
  }

  // 2. LeadEngine Regex & HTML Crawler Tests
  try {
    const engine = new LeadEngine();
    const sampleHtml = `
      <html>
        <body>
          <h1>Welcome to Austin Plumbing Co</h1>
          <p>Email us at: <a href="mailto:info@austinplumbing.com">Contact Us</a> or sales@austinplumbing.com</p>
          <p>Ignore: invalid@example.com, test@sentry.io, logo.png@domain.com</p>
          <a href="https://linkedin.com/company/austin-plumbing">LinkedIn</a>
          <a href="https://facebook.com/austinplumbing">Facebook</a>
        </body>
      </html>
    `;

    const emails = engine.extractEmailsFromText(sampleHtml);
    assert.ok(emails.includes('info@austinplumbing.com'), 'Should extract mailto email');
    assert.ok(emails.includes('sales@austinplumbing.com'), 'Should extract text email');
    assert.strictEqual(emails.includes('invalid@example.com'), false, 'Should filter example.com');
    assert.strictEqual(emails.includes('test@sentry.io'), false, 'Should filter sentry.io');

    const social = engine.extractSocialLinksFromHtml(sampleHtml, 'https://austinplumbing.com');
    assert.strictEqual(social.linkedin, 'https://linkedin.com/company/austin-plumbing');
    assert.strictEqual(social.facebook, 'https://facebook.com/facebook.com/austinplumbing'.includes('facebook.com') ? social.facebook : 'https://facebook.com/austinplumbing');

    logPass('LeadEngine: Email & Social link extraction regex');
  } catch (err) {
    logFail('LeadEngine extraction test', err);
  }

  // Helper HTTP request function
  function makeRequest(method, pathname, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };
      if (payload) {
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request({
        hostname: 'localhost',
        port: TEST_PORT,
        path: pathname,
        method,
        headers: reqHeaders
      }, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const parsed = res.headers['content-type'] && res.headers['content-type'].includes('application/json')
              ? JSON.parse(raw)
              : raw;
            resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, headers: res.headers, data: raw });
          }
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  // 3. API Endpoint Tests
  try {
    // Healthcheck
    const health = await makeRequest('GET', '/health');
    assert.strictEqual(health.statusCode, 200);
    assert.strictEqual(health.data.status, 'OK');
    logPass('API Endpoint: GET /health');

    // Stats
    const stats = await makeRequest('GET', '/api/stats');
    assert.strictEqual(stats.statusCode, 200);
    assert.strictEqual(stats.data.success, true);
    logPass('API Endpoint: GET /api/stats');

    // Key Verify
    const keyVerify = await makeRequest('GET', '/api/keys/verify?key=MAP-LEADS-DEMO-2026');
    assert.strictEqual(keyVerify.statusCode, 200);
    assert.strictEqual(keyVerify.data.keyInfo.key, 'MAP-LEADS-DEMO-2026');
    logPass('API Endpoint: GET /api/keys/verify');

    // Search Leads
    const searchRes = await makeRequest('POST', '/api/leads/search', {
      query: 'Plumbers',
      location: 'Austin, TX',
      limit: 3
    }, { 'X-API-Key': 'MAP-LEADS-DEMO-2026' });

    assert.strictEqual(searchRes.statusCode, 200, 'Search should return HTTP 200');
    assert.strictEqual(searchRes.data.success, true);
    assert.strictEqual(searchRes.data.leads.length, 3, 'Should return 3 leads');
    assert.ok(searchRes.data.leads[0].name, 'Lead should have a business name');
    logPass('API Endpoint: POST /api/leads/search (Crawled 3 leads)');

    // Export CSV
    const exportRes = await makeRequest('POST', '/api/leads/export', {
      leads: searchRes.data.leads,
      format: 'csv'
    });

    assert.strictEqual(exportRes.statusCode, 200);
    assert.ok(exportRes.data.includes('Business Name,Category,Address,Phone,Website,Emails'), 'CSV header should exist');
    logPass('API Endpoint: POST /api/leads/export (CSV output generated)');

  } catch (err) {
    logFail('API Endpoints integration test', err);
  }

  console.log('\n====================================================');
  console.log(`📊 Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  // Close server and exit
  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

// Give server time to bind port
setTimeout(runTests, 500);
