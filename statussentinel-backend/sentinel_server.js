const fs = require('fs');
const path = require('path');
const http = require('http');

const express = require('../docforge-backend/node_modules/express');
const cors = require('../docforge-backend/node_modules/cors');

const db = require('./sentinelDb');
const monitorEngine = require('./monitorEngine');
const alertDispatcher = require('./alertDispatcher');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4006;

app.use(cors());
app.use(express.json());

// Serve static admin dashboard & status page assets
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// Core REST API Endpoints
// -------------------------------------------------------------

// GET /v1/health
app.get('/v1/health', (req, res) => {
  const monitors = db.getMonitors();
  const healthyCount = monitors.filter(m => m.status === 'UP').length;

  res.json({
    status: 'healthy',
    service: 'StatusSentinel Micro-Service Monitor & Hosted Status Pages',
    version: '1.0.0',
    total_monitors: monitors.length,
    healthy_monitors: healthyCount,
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET /v1/monitors — List all active monitors
app.get('/v1/monitors', (req, res) => {
  const monitors = db.getMonitors();
  return res.json({ status: 'success', total: monitors.length, data: monitors });
});

// POST /v1/monitors — Create or Update a Monitor
app.post('/v1/monitors', async (req, res) => {
  const { id, name, url, interval_seconds = 30, discord_webhook, telegram_bot_token, telegram_chat_id } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'bad_request', message: 'Fields "name" and "url" are required.' });
  }

  const newId = id || `mon_${Date.now()}`;
  const monitorData = {
    id: newId,
    name,
    url,
    interval_seconds,
    discord_webhook,
    telegram_bot_token,
    telegram_chat_id,
    status: 'UP',
    latency_ms: 0,
    uptime_pct: 100.0,
    ssl_days_remaining: 180,
    last_checked: new Date().toISOString(),
    consecutive_failures: 0,
    created_at: new Date().toISOString()
  };

  db.saveMonitor(monitorData);
  // Trigger immediate initial check
  await monitorEngine.checkMonitor(monitorData);

  return res.status(201).json({ status: 'success', data: db.getMonitorById(newId) });
});

// DELETE /v1/monitors/:id — Delete a Monitor
app.delete('/v1/monitors/:id', (req, res) => {
  const { id } = req.params;
  db.deleteMonitor(id);
  return res.json({ status: 'success', message: `Monitor ${id} deleted.` });
});

// GET /v1/status-pages/:slug — Get Hosted Status Page Config & Telemetry
app.get('/v1/status-pages/:slug', (req, res) => {
  const { slug } = req.params;
  const page = db.getStatusPageBySlug(slug);
  const allMonitors = db.getMonitors();
  
  // Filter monitors assigned to this page
  const pageMonitors = page.monitors && page.monitors.length > 0
    ? allMonitors.filter(m => page.monitors.includes(m.id))
    : allMonitors;

  const incidents = db.getIncidents();

  const isOverallUp = pageMonitors.every(m => m.status === 'UP');
  const hasMajorOutage = pageMonitors.some(m => m.status === 'DOWN');
  const overallStatus = isOverallUp ? 'ALL_SYSTEMS_OPERATIONAL' : (hasMajorOutage ? 'MAJOR_OUTAGE' : 'PARTIAL_OUTAGE');

  return res.json({
    status: 'success',
    data: {
      ...page,
      overall_status: overallStatus,
      monitors: pageMonitors,
      incidents
    }
  });
});

// GET /v1/incidents — List system incidents
app.get('/v1/incidents', (req, res) => {
  return res.json({ status: 'success', data: db.getIncidents() });
});

// POST /v1/incidents — Create a new incident report
app.post('/v1/incidents', (req, res) => {
  const { title, impact = 'MINOR', description, monitors_affected = [] } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'bad_request', message: 'Fields "title" and "description" are required.' });
  }

  const incidentData = {
    id: `inc_${Date.now()}`,
    title,
    status: 'INVESTIGATING',
    impact,
    description,
    monitors_affected,
    updates: [
      {
        timestamp: new Date().toISOString(),
        status: 'INVESTIGATING',
        message: description
      }
    ],
    created_at: new Date().toISOString()
  };

  db.addIncident(incidentData);
  return res.status(201).json({ status: 'success', data: incidentData });
});

// POST /v1/alerts/discord — Dispatch Test Discord Alert
app.post('/v1/alerts/discord', async (req, res) => {
  const { webhook_url, monitor_id = 'mon_api_core' } = req.body;
  const monitor = db.getMonitorById(monitor_id) || { name: 'Demo API Gateway', url: 'https://api.sentinel.io', latency_ms: 42, http_status: 200 };
  
  const incidentData = {
    event: 'DOWN',
    monitor_id: monitor.id,
    monitor_name: monitor.name,
    url: monitor.url,
    latency_ms: monitor.latency_ms || 95,
    http_status: 503,
    message: 'TEST ALERT: High latency and HTTP 503 Service Unavailable threshold breached.'
  };

  const result = await alertDispatcher.dispatchDiscordAlert(webhook_url, incidentData);
  return res.json({
    status: 'success',
    is_live_delivered: !result.is_simulated,
    dispatched_embed: {
      title: `🔴 SYSTEM INCIDENT DETECTED: ${incidentData.monitor_name}`,
      description: incidentData.message,
      color: 0xF43F5E,
      fields: [
        { name: 'Target URL', value: `\`${incidentData.url}\``, inline: true },
        { name: 'Latency', value: `\`${incidentData.latency_ms}ms\``, inline: true },
        { name: 'Status Code', value: `\`${incidentData.http_status}\``, inline: true }
      ]
    }
  });
});

// POST /v1/keys — Provision API Key
app.post('/v1/keys', (req, res) => {
  const { plan = 'pro', name = 'Pro Sentinel Operator' } = req.body;
  const newKey = `sentinel_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
  const keyObj = { key: newKey, plan, name, created_at: new Date().toISOString() };
  db.addApiKey(keyObj);
  return res.status(201).json({ status: 'success', key: newKey });
});

// POST /v1/checkout/create-session — Stripe Checkout Integration
app.post('/v1/checkout/create-session', (req, res) => {
  const { plan = 'pro', email = 'operator@sentinel.io' } = req.body;
  const newKey = `sentinel_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
  const priceAmount = plan === 'starter' ? 1500 : 4900;
  
  db.addSubscription({
    id: `sub_${Date.now()}`,
    email,
    plan,
    api_key: newKey,
    created_at: new Date().toISOString()
  });

  return res.json({
    status: 'success',
    checkout_url: `https://checkout.stripe.com/pay/simulated_sentinel_${plan}_${Date.now()}`,
    api_key: newKey,
    amount_usd: priceAmount / 100
  });
});

// GET /status/:slug — Render Hosted Public Status Page HTML
app.get('/status/:slug', (req, res) => {
  const statusHtmlPath = path.join(__dirname, 'public', 'status.html');
  if (fs.existsSync(statusHtmlPath)) {
    return res.sendFile(statusHtmlPath);
  }
  return res.send(`<h1>StatusSentinel Hosted Page</h1><p>Status page for ${req.params.slug}</p>`);
});

// Start Monitoring Engine
monitorEngine.startEngine(30000);

// Start HTTP Server
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`⚡ StatusSentinel Monitoring Engine running on port ${PORT}`);
  console.log(`👉 Admin Dashboard: http://localhost:${PORT}`);
  console.log(`👉 Hosted Status Page: http://localhost:${PORT}/status/default`);
  console.log(`👉 Health Check: GET http://localhost:${PORT}/v1/health`);
  console.log(`=================================================`);
});

module.exports = app;
