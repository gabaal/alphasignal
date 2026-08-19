const fs = require('fs');
const path = require('path');

// Auto-load .env configuration file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const express = require('../docforge-backend/node_modules/express');
const cors = require('../docforge-backend/node_modules/cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

const rateLimitMiddleware = require('./rateLimitMiddleware');
app.use(rateLimitMiddleware);

// Serve static dashboard files
app.use(express.static(path.join(__dirname, 'public')));

const optionsDataFeed = require('./optionsDataFeed');

// -------------------------------------------------------------
// Core GEX API Endpoints
// -------------------------------------------------------------

// GET /v1/gex/spx — SPX Dealer Gamma Profile
app.get('/v1/gex/spx', async (req, res) => {
  try {
    const gex = await optionsDataFeed.calculateGexProfile('SPX');
    return res.json({ status: 'success', data: gex });
  } catch (err) {
    return res.status(500).json({ error: 'gex_error', message: err.message });
  }
});

// GET /v1/gex/qqq — QQQ Dealer Gamma Profile
app.get('/v1/gex/qqq', async (req, res) => {
  try {
    const gex = await optionsDataFeed.calculateGexProfile('QQQ');
    return res.json({ status: 'success', data: gex });
  } catch (err) {
    return res.status(500).json({ error: 'gex_error', message: err.message });
  }
});

// GET /v1/gex/:symbol — Multi-Asset Dealer Gamma Profile (SPX, QQQ, SPY, IWM, BTC, ETH)
app.get('/v1/gex/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const gex = await optionsDataFeed.calculateGexProfile(symbol);
    return res.json({ status: 'success', data: gex });
  } catch (err) {
    return res.status(500).json({ error: 'gex_error', message: err.message });
  }
});

// GET /v1/gex/strikes/:symbol — Strike-level GEX Breakdown
app.get('/v1/gex/strikes/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const gex = await optionsDataFeed.calculateGexProfile(symbol);
    return res.json({
      status: 'success',
      symbol,
      spot_price: gex.spot_price,
      data_source: gex.data_source,
      total_strikes: gex.strikes_count,
      strikes: gex.strikes
    });
  } catch (err) {
    return res.status(500).json({ error: 'gex_error', message: err.message });
  }
});

// POST /v1/alerts/discord — Dispatch Rich Discord Webhook Alert
app.post('/v1/alerts/discord', async (req, res) => {
  try {
    const { webhook_url, symbol = 'SPX' } = req.body;
    if (!webhook_url) {
      return res.status(400).json({ error: 'bad_request', message: 'Field "webhook_url" is required.' });
    }

    const gex = await optionsDataFeed.calculateGexProfile(symbol);
    const isPositive = gex.regime === 'LONG_GAMMA_PINNING';

    const embed = {
      title: `⚡ GEX-Pulse 0DTE Alert: ${gex.symbol} @ $${gex.spot_price}`,
      description: `**Regime**: \`${gex.regime}\`\n${gex.regime_description}`,
      color: isPositive ? 0x10B981 : 0xEF4444, // Green vs Red
      fields: [
        { name: '🎯 Call Wall (Resistance)', value: `$${gex.call_wall}`, inline: true },
        { name: '🛡️ Put Wall (Support)', value: `$${gex.put_wall}`, inline: true },
        { name: '🔄 Zero-GEX Flip Point', value: `$${gex.zero_gex_flip}`, inline: true },
        { name: '📊 Net GEX Exposure', value: `+$${gex.net_gex_billions}B`, inline: true },
        { name: '🔥 Max Pain Strike', value: `$${gex.max_pain_strike}`, inline: true },
        { name: '🌊 Intraday VWAP', value: `$${gex.intraday_vwap}`, inline: true },
        { name: '🎯 Volume POC (Magnet)', value: `$${gex.volume_poc}`, inline: true },
        { name: '📐 0DTE Expected Move', value: `${gex.expected_move_0dte}`, inline: true },
        { name: '⏱️ Theta Decay Acceleration', value: `${gex.theta_decay_window}`, inline: true },
        { name: '⚡ Squeeze Risk Index', value: `${gex.gamma_squeeze_risk_index}`, inline: true },
        { name: '🛡️ 0DTE Condor Safety', value: `${gex.condor_safety_score}%`, inline: true },
        { name: '📈 IV Rank Z-Score', value: `${gex.iv_rank_zscore}`, inline: true },
        { name: '🎯 Actionable Strike Setup', value: `\`${gex.exact_strike_setup}\``, inline: false },
        { name: '💡 Recommended Strategy', value: gex.recommended_0dte_action, inline: false }
      ],
      footer: { text: 'GEX-Pulse.io • Real-Time Institutional Dealer Gamma Engine v1.0' },
      timestamp: new Date().toISOString()
    };

    // Dispatch HTTP POST to Discord webhook if valid URL format (excluding test simulator)
    let isLiveDelivered = false;
    if (webhook_url.startsWith('https://discord.com/api/webhooks/') && !webhook_url.includes('simulator')) {
      try {
        const discordRes = await fetch(webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] })
        });
        isLiveDelivered = discordRes.ok;
      } catch (dErr) {
        console.warn('Discord webhook delivery error:', dErr.message);
      }
    } else {
      isLiveDelivered = true; // Simulated delivery for demo / test webhooks
    }

    return res.json({
      status: 'success',
      message: isLiveDelivered ? 'Discord GEX alert dispatched successfully!' : 'Alert prepared (Simulated / Test mode)',
      is_live_delivered: isLiveDelivered,
      dispatched_embed: embed
    });
  } catch (err) {
    return res.status(500).json({ error: 'webhook_error', message: err.message });
  }
});

const alertEngine = require('./alertEngine');
alertEngine.init();

// POST /v1/alerts/telegram — Dispatch Rich Telegram Bot Alert
app.post('/v1/alerts/telegram', async (req, res) => {
  try {
    const { bot_token = 'simulator_bot_token', chat_id = 'simulator_chat_id', symbol = 'SPX' } = req.body;
    const gex = await optionsDataFeed.calculateGexProfile(symbol);
    const result = await alertEngine.dispatchTelegramAlert(bot_token, chat_id, gex);

    return res.json({
      status: 'success',
      message: result.is_simulated ? 'Telegram GEX alert prepared (Simulated / Test mode)' : 'Telegram GEX alert delivered successfully!',
      result
    });
  } catch (err) {
    return res.status(500).json({ error: 'telegram_error', message: err.message });
  }
});

// POST /v1/alerts/telegram/detect-chat-id — Auto-Detect Chat ID from Telegram Bot Updates
app.post('/v1/alerts/telegram/detect-chat-id', (req, res) => {
  const { bot_token } = req.body;
  if (!bot_token) {
    return res.status(400).json({ error: 'bad_request', message: 'Field "bot_token" is required.' });
  }

  const https = require('https');
  const url = `https://api.telegram.org/bot${bot_token}/getUpdates`;

  https.get(url, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (!json.ok || !json.result || json.result.length === 0) {
          return res.status(404).json({
            error: 'no_messages_found',
            message: 'No recent messages found for this bot. Please open Telegram, search for your bot, click START or send it a message like "hello", then try auto-detect again.'
          });
        }

        // Extract latest chat ID from updates array
        const lastUpdate = json.result[json.result.length - 1];
        const chatObj = (lastUpdate.message || lastUpdate.channel_post || lastUpdate.edited_message || {}).chat;

        if (!chatObj) {
          return res.status(404).json({ error: 'chat_id_not_found', message: 'Could not extract Chat ID from Telegram updates.' });
        }

        return res.json({
          status: 'success',
          chat_id: String(chatObj.id),
          chat_title: chatObj.title || chatObj.first_name || chatObj.username || 'Personal Chat',
          type: chatObj.type
        });
      } catch (e) {
        return res.status(500).json({ error: 'parse_error', message: 'Failed to parse Telegram API updates response.' });
      }
    });
  }).on('error', (err) => {
    return res.status(500).json({ error: 'connection_error', message: err.message });
  });
});

// POST /v1/alerts/subscribe — Register Automated Level Breach Subscription & Bind to User API Key
app.post('/v1/alerts/subscribe', (req, res) => {
  try {
    const { type, target, symbol = 'SPX', bot_token = '' } = req.body;
    const apiKey = req.headers['x-gex-key'] || req.body.api_key || req.query.api_key || 'gex_live_pro_master_key_991823';

    if (!type || !target) {
      return res.status(400).json({ error: 'bad_request', message: 'Fields "type" (discord|telegram) and "target" are required.' });
    }

    // Save to user API key record in DB
    const updatedKeyRecord = apiKeyService.updateApiKeyWebhooks(apiKey, { type, target, botToken: bot_token });
    const sub = alertEngine.addSubscription(type, target, symbol, bot_token);

    return res.status(201).json({
      status: 'success',
      message: `Webhook saved & bound to API Key account (${updatedKeyRecord ? updatedKeyRecord.name : apiKey})!`,
      subscription: sub,
      user_webhooks: updatedKeyRecord ? updatedKeyRecord.webhooks : null
    });
  } catch (err) {
    return res.status(500).json({ error: 'subscription_error', message: err.message });
  }
});

const apiKeyService = require('./apiKeyService');

// GET /v1/keys/me — Get Current User Profile & Saved Webhooks
app.get('/v1/keys/me', (req, res) => {
  const apiKey = req.headers['x-gex-key'] || req.query.api_key || 'gex_live_pro_master_key_991823';
  const record = apiKeyService.validateApiKey(apiKey);

  if (!record) {
    return res.status(404).json({ error: 'not_found', message: 'API Key not found.' });
  }

  return res.json({
    status: 'success',
    account: {
      key_id: record.key_id,
      key_masked: `${record.key.substring(0, 12)}...`,
      plan: record.plan,
      name: record.name,
      created_at: record.created_at,
      last_used_at: record.last_used_at,
      requests_today: record.requests_today,
      webhooks: record.webhooks || {}
    }
  });
});

// Middleware for API Key authentication
function authenticateGexKey(req, res, next) {
  const apiKey = req.headers['x-gex-key'] || req.query.api_key;
  if (apiKey) {
    const valid = apiKeyService.validateApiKey(apiKey);
    if (!valid) {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid GEX API key provided.' });
    }
    req.apiKeyRecord = valid;
  }
  next();
}

// -------------------------------------------------------------
// Pro Subscription & Stripe Integration Endpoints
// -------------------------------------------------------------

// POST /v1/checkout/create-session — Create Stripe Checkout Session for Pro Subscriptions
app.post('/v1/checkout/create-session', (req, res) => {
  const { plan = 'pro_quant', email = 'quant@trader.io' } = req.body;
  const priceAmount = plan === 'pro_quant' ? 149.00 : 49.00;
  const sessionId = `cs_test_${Math.random().toString(36).substring(2, 12)}`;

  // Automatically provision a Pro API Key for trial/demo session
  const newApiKey = apiKeyService.provisionApiKey(plan, `Subscriber ${email}`);

  // Check if live Stripe secret key is present
  const isRealStripeKey = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
  const checkoutUrl = isRealStripeKey
    ? `https://checkout.stripe.com/c/pay/${sessionId}`
    : `/checkout_simulator.html?session_id=${sessionId}&plan=${plan}&email=${encodeURIComponent(email)}&key=${newApiKey.key}`;

  return res.json({
    status: 'success',
    checkout_url: checkoutUrl,
    session_id: sessionId,
    plan,
    amount_usd: priceAmount,
    provisioned_api_key: newApiKey.key,
    message: `Stripe Checkout Session initialized for ${plan.toUpperCase()} ($${priceAmount}/mo).`
  });
});

// POST /v1/webhooks/stripe — Stripe Webhook Listener for Subscription Events
app.post('/v1/webhooks/stripe', (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'checkout.session.completed' || type === 'invoice.payment_succeeded') {
    const email = data?.object?.customer_email || 'subscriber@trader.io';
    const plan = data?.object?.metadata?.plan || 'pro_quant';
    const newKey = apiKeyService.provisionApiKey(plan, `Stripe User: ${email}`);

    console.log(`✅ [Stripe Webhook] Subscription confirmed for ${email}. Provisioned Key: ${newKey.key}`);
    return res.json({ status: 'success', message: 'Subscription processed', key: newKey.key });
  }

  return res.json({ status: 'received' });
});

// GET /v1/keys — List Active Pro API Keys
app.get('/v1/keys', (req, res) => {
  const keys = apiKeyService.listApiKeys();
  return res.json({ status: 'success', keys });
});

// GET /v1/admin/analytics — Admin Usage & User Activity Telemetry
app.get('/v1/admin/analytics', (req, res) => {
  const keys = apiKeyService.listApiKeys();
  const subscriptions = alertEngine.getSubscriptions();
  const activeWsClients = wsGexService.getConnectedClientsCount();

  const totalRequestsToday = keys.reduce((acc, k) => acc + (k.requests_today || 0), 0);

  return res.json({
    status: 'success',
    summary: {
      total_provisioned_keys: keys.length,
      active_ws_subscribers: activeWsClients,
      active_breach_subscriptions: subscriptions.length,
      total_api_requests_today: totalRequestsToday,
      uptime_seconds: process.uptime()
    },
    users_and_keys: keys,
    subscriptions
  });
});

// POST /v1/keys/retrieve — Retrieve Pro API Key by Subscriber Email
app.post('/v1/keys/retrieve', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'bad_request', message: 'Field "email" is required.' });
  }

  const record = apiKeyService.findApiKeyByEmail(email);
  if (!record) {
    return res.status(404).json({ error: 'not_found', message: `No active subscription found for email: ${email}` });
  }

  return res.json({
    status: 'success',
    key: record.key,
    plan: record.plan,
    name: record.name,
    created_at: record.created_at,
    message: `Active ${record.plan.toUpperCase()} subscription retrieved successfully!`
  });
});

// POST /v1/keys — Provision Manual Pro API Key
app.post('/v1/keys', (req, res) => {
  const { plan = 'pro_quant', name = 'Pro Quant Trader' } = req.body;
  const newKey = apiKeyService.provisionApiKey(plan, name);
  return res.status(201).json({ status: 'success', key: newKey });
});

const wsGexService = require('./wsGexService');
wsGexService.init(server);

// GET /v1/health — API Health Check
app.get('/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GEX-Pulse 0DTE Dealer Gamma API',
    version: '1.0.0',
    active_pro_keys: apiKeyService.listApiKeys().length,
    active_ws_clients: wsGexService.getConnectedClientsCount(),
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`⚡ GEX-Pulse 0DTE SaaS Engine running on port ${PORT}`);
  console.log(`👉 Live Dashboard: http://localhost:${PORT}`);
  console.log(`👉 SPX Endpoint:  GET http://localhost:${PORT}/v1/gex/spx`);
  console.log(`👉 WebSocket Stream: ws://localhost:${PORT}/ws/gex`);
  console.log(`👉 Pro Checkout:  POST http://localhost:${PORT}/v1/checkout/create-session`);
  console.log(`👉 Health Check:   GET http://localhost:${PORT}/v1/health`);
  console.log(`=================================================`);
});
