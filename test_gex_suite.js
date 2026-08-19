const assert = require('assert');
const http = require('http');
const WebSocket = require('./docforge-backend/node_modules/ws');

const BASE_URL = 'http://localhost:4005';
let passedTests = 0;
let totalTests = 0;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
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

async function runGexTestSuite() {
  console.log('\n================================================================');
  console.log('⚡ GEX-PULSE 0DTE OPTIONS ENGINE MASTER TEST SUITE');
  console.log('================================================================');
  console.log(`Target API: ${BASE_URL}\n`);

  // STEP 1: Healthcheck
  console.log('--- Step 1: Healthcheck Endpoint ---');
  const healthRes = await request('/v1/health');
  check(healthRes.status === 200, 'GET /v1/health returns HTTP 200 OK');
  check(healthRes.data.status === 'healthy', 'API status is "healthy"');
  check(healthRes.data.service.includes('0DTE Dealer Gamma API'), 'Service identifies as 0DTE Dealer Gamma API');

  // STEP 2: SPX GEX Profile Telemetry
  console.log('\n--- Step 2: SPX Dealer Gamma Profile Telemetry ---');
  const spxRes = await request('/v1/gex/spx');
  check(spxRes.status === 200, 'GET /v1/gex/spx returns HTTP 200 OK');
  check(spxRes.data.status === 'success', 'Response status is "success"');
  check(typeof spxRes.data.data.spot_price === 'number', 'Calculated valid numeric SPX spot price');
  check(typeof spxRes.data.data.call_wall === 'number', 'Calculated Call Wall level');
  check(typeof spxRes.data.data.put_wall === 'number', 'Calculated Put Wall level');
  check(typeof spxRes.data.data.zero_gex_flip === 'number', 'Calculated Zero-GEX Flip point');
  check(spxRes.data.data.condor_safety_score >= 0 && spxRes.data.data.condor_safety_score <= 100, '0DTE Iron Condor Safety Score is within 0-100% range');

  // STEP 3: QQQ Dealer Gamma Profile Telemetry
  console.log('\n--- Step 3: QQQ Dealer Gamma Profile Telemetry ---');
  const qqqRes = await request('/v1/gex/qqq');
  check(qqqRes.status === 200, 'GET /v1/gex/qqq returns HTTP 200 OK');
  check(qqqRes.data.data.symbol === 'QQQ', 'Symbol identifies as QQQ');

  // STEP 3B: Deribit BTC Crypto Options Telemetry
  console.log('\n--- Step 3B: Deribit BTC Crypto Options Telemetry ---');
  const btcRes = await request('/v1/gex/btc');
  check(btcRes.status === 200, 'GET /v1/gex/btc returns HTTP 200 OK');
  check(btcRes.data.data.symbol === 'BTC', 'Symbol identifies as BTC');
  check(typeof btcRes.data.data.data_source === 'string', 'Contains valid data_source tag');

  // STEP 3C: SPY Equity Options Telemetry
  console.log('\n--- Step 3C: SPY Equity Options Telemetry ---');
  const spyRes = await request('/v1/gex/spy');
  check(spyRes.status === 200, 'GET /v1/gex/spy returns HTTP 200 OK');
  check(spyRes.data.data.symbol === 'SPY', 'Symbol identifies as SPY');

  // STEP 3C: Strike-level GEX Breakdown Endpoint
  console.log('\n--- Step 3C: Strike-level GEX Breakdown ---');
  const strikeRes = await request('/v1/gex/strikes/spx');
  check(strikeRes.status === 200, 'GET /v1/gex/strikes/spx returns HTTP 200 OK');
  check(Array.isArray(strikeRes.data.strikes) && strikeRes.data.strikes.length > 0, 'Returns non-empty strike-level GEX array');
  check(typeof strikeRes.data.strikes[0].net_gex === 'number', 'Strike array contains valid numeric net_gex');

  // STEP 4: Discord Webhook Alert Formatting
  console.log('\n--- Step 4: Discord Webhook Alert Dispatcher ---');
  const discordRes = await request('/v1/alerts/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { webhook_url: 'https://discord.com/api/webhooks/simulator', symbol: 'SPX' }
  });
  check(discordRes.status === 200, 'POST /v1/alerts/discord returns HTTP 200 OK');
  check(discordRes.data.status === 'success', 'Discord alert status is "success"');
  check(discordRes.data.dispatched_embed.title.includes('SPX'), 'Formatted rich Discord embed card with SPX levels');

  // STEP 5: Pro API Key Provisioning
  console.log('\n--- Step 5: Pro API Key Provisioning ---');
  const keyRes = await request('/v1/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { plan: 'pro_quant', name: 'AlphaQuant Fund' }
  });
  check(keyRes.status === 201, 'POST /v1/keys provisions new Pro API Key');
  check(keyRes.data.key.key.startsWith('gex_live_'), 'Generated valid "gex_live_" API Key prefix');
  check(keyRes.data.key.plan === 'pro_quant', 'Plan tier assigned as "pro_quant"');

  // STEP 6: Stripe Checkout Session Initialization
  console.log('\n--- Step 6: Stripe Checkout Session Initialization ---');
  const checkoutRes = await request('/v1/checkout/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { plan: 'pro_quant', email: 'pro@quanttrader.io' }
  });
  check(checkoutRes.status === 200, 'POST /v1/checkout/create-session returns HTTP 200 OK');
  check(checkoutRes.data.amount_usd === 149, 'Checkout session amount set to $149 USD for Pro Quant API');
  check(typeof checkoutRes.data.provisioned_api_key === 'string', 'Provisioned Pro API key upon session creation');

  // STEP 7: Stripe Webhook Listener
  console.log('\n--- Step 7: Stripe Webhook Listener ---');
  const stripeWebhookRes = await request('/v1/webhooks/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      type: 'checkout.session.completed',
      data: { object: { customer_email: 'subscriber@hedgefund.io', metadata: { plan: 'pro_quant' } } }
    }
  });
  check(stripeWebhookRes.status === 200, 'POST /v1/webhooks/stripe returns HTTP 200 OK');
  check(stripeWebhookRes.data.status === 'success', 'Stripe subscription webhook processed successfully');

  // STEP 8: WebSocket Telemetry Stream Test
  console.log('\n--- Step 8: WebSocket Telemetry Streaming Test ---');
  const wsTested = await new Promise((resolve) => {
    try {
      const ws = new WebSocket('ws://localhost:4005/ws/gex?symbol=SPX');
      let recCount = 0;

      ws.on('open', () => {
        check(true, 'WebSocket connection established on ws://localhost:4005/ws/gex');
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          recCount++;
          if (recCount === 1) {
            check(parsed.type === 'connection_established', 'Received "connection_established" welcome frame');
          } else if (parsed.type === 'gex_tick') {
            check(parsed.symbol === 'SPX', 'Received "gex_tick" telemetry frame for SPX');
            check(typeof parsed.data.spot_price === 'number', 'Telemetry tick contains numeric spot price');
            ws.close();
            resolve(true);
          }
        } catch (e) {
          ws.close();
          resolve(false);
        }
      });

      ws.on('error', (err) => {
        console.error('WS Error:', err.message);
        resolve(false);
      });
    } catch (err) {
      resolve(false);
    }
  });
  check(wsTested === true, 'Successfully received live GEX telemetry ticks via WebSocket stream');

  // STEP 9: Telegram Alert Dispatcher Test
  console.log('\n--- Step 9: Telegram Alert Dispatcher ---');
  const tgRes = await request('/v1/alerts/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { bot_token: 'simulator_bot_token', chat_id: 'simulator_chat_id', symbol: 'SPX' }
  });
  check(tgRes.status === 200, 'POST /v1/alerts/telegram returns HTTP 200 OK');
  check(tgRes.data.status === 'success', 'Telegram alert status is "success"');
  check(tgRes.data.result.is_simulated === true, 'Telegram alert executed in simulated mode');

  // STEP 10: Automated Breach Subscription Test
  console.log('\n--- Step 10: Automated Breach Subscription ---');
  const subRes = await request('/v1/alerts/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { type: 'discord', target: 'https://discord.com/api/webhooks/simulator', symbol: 'SPX' }
  });
  check(subRes.status === 201, 'POST /v1/alerts/subscribe provisions automated breach subscription');
  check(subRes.data.subscription.type === 'discord', 'Subscription registered as "discord"');

  // STEP 12: Tier-based Rate Limiting & Headers Test
  console.log('\n--- Step 12: Rate Limiting & Headers Test ---');
  const rateLimitRes = await request('/v1/gex/spx');
  check(rateLimitRes.headers['x-ratelimit-limit'] !== undefined, 'Exposes X-RateLimit-Limit header');
  check(rateLimitRes.headers['x-ratelimit-remaining'] !== undefined, 'Exposes X-RateLimit-Remaining header');
  check(rateLimitRes.headers['x-ratelimit-reset'] !== undefined, 'Exposes X-RateLimit-Reset header');

  // STEP 13: Database Persistence Verification
  console.log('\n--- Step 13: Database Persistence Verification ---');
  const keysListRes = await request('/v1/keys');
  check(keysListRes.status === 200, 'GET /v1/keys returns HTTP 200 OK');
  check(Array.isArray(keysListRes.data.keys) && keysListRes.data.keys.length >= 1, 'Database contains persistent API keys store');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} GEX-PULSE MASTER INTEGRATION TESTS PASSED!`);
  console.log('================================================================\n');
}

runGexTestSuite().catch(err => {
  console.error('Fatal Test Failure:', err);
  process.exit(1);
});
