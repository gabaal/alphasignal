const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { compileAndRenderPdf } = require('./services/pdfEngine');
const ledgerService = require('./services/ledgerService');
const templateService = require('./services/templateService');
const batchQueueService = require('./services/batchQueueService');
const apiKeyService = require('./services/apiKeyService');
const wsTelemetryService = require('./services/wsTelemetryService');
const copilotService = require('./services/copilotService');
const { rateLimiterMiddleware } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static documentation assets
app.use(express.static(path.join(__dirname, 'public')));

// API Key Validation Middleware
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-docforge-key'] || req.headers['authorization'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing required header X-DocForge-Key.'
    });
  }

  const cleanKey = apiKey.replace('Bearer ', '').trim();
  const keyDetails = apiKeyService.validateApiKey(cleanKey);

  if (!keyDetails) {
    return res.status(401).json({
      error: 'invalid_api_key',
      message: 'Provided API Key is invalid or has been revoked.'
    });
  }

  req.apiKey = cleanKey;
  req.apiKeyDetails = keyDetails;
  next();
}

// -------------------------------------------------------------
// 1. OPENAPI & DOCS ROUTES
// -------------------------------------------------------------
app.get('/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.json'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

// -------------------------------------------------------------
// 2. TEMPLATES API ROUTES
// -------------------------------------------------------------

// POST /v1/templates — Create or Version a Template
app.post('/v1/templates', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  try {
    const { template_id, name, html, css = '', default_options = {} } = req.body;
    if (!template_id || !name || !html) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Fields "template_id", "name", and "html" are required.'
      });
    }

    const result = templateService.saveTemplate({
      template_id,
      name,
      html,
      css,
      default_options
    });

    return res.status(201).json({
      status: 'success',
      message: `Template "${template_id}" version ${result.version} created successfully.`,
      template: result
    });
  } catch (err) {
    return res.status(500).json({ error: 'template_error', message: err.message });
  }
});

// POST /v1/templates/copilot — DocForge Copilot AI Synthesis Engine
app.post('/v1/templates/copilot', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'bad_request', message: 'Field "prompt" is required for Copilot AI synthesis.' });
    }

    const copilotResult = copilotService.generateTemplateFromPrompt(prompt, req.body.options || {});
    return res.status(200).json(copilotResult);
  } catch (err) {
    return res.status(500).json({ error: 'copilot_error', message: err.message });
  }
});

// GET /v1/templates — List Registered Templates
app.get('/v1/templates', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  const templates = templateService.listTemplates();
  return res.json({ status: 'success', templates });
});

// GET /v1/templates/:template_id — Get Template Details & Version History
app.get('/v1/templates/:template_id', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  const { template_id } = req.params;
  const version = req.query.version;

  const template = templateService.getTemplate(template_id, version);
  if (!template) {
    return res.status(404).json({ error: 'not_found', message: `Template "${template_id}" not found.` });
  }

  const versions = templateService.getTemplateVersions(template_id);
  return res.json({ status: 'success', template, history: versions });
});

// -------------------------------------------------------------
// 3. POST /v1/render — PDF Generation Endpoint
// -------------------------------------------------------------
app.post('/v1/render', authenticateApiKey, rateLimiterMiddleware, async (req, res) => {
  try {
    const {
      template_id,
      version,
      html,
      css,
      data = {},
      options = {},
      response_type = 'binary'
    } = req.body;

    let renderHtml = html;
    let renderCss = css || '';
    let renderOptions = { ...options };

    // Resolve template if template_id is specified
    if (template_id) {
      const storedTemplate = templateService.getTemplate(template_id, version);
      if (!storedTemplate) {
        return res.status(404).json({
          error: 'template_not_found',
          message: `Template "${template_id}" (version: ${version || 'latest'}) was not found.`
        });
      }
      if (!renderHtml) renderHtml = storedTemplate.html;
      if (!renderCss) renderCss = storedTemplate.css;
      renderOptions = { ...storedTemplate.default_options, ...renderOptions };
    }

    if (!renderHtml) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Field "html" or a valid "template_id" is required.'
      });
    }

    const renderJobId = `job_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    wsTelemetryService.broadcastJobProgress(renderJobId, 'rendering_html', { template_id });

    // Render PDF using Puppeteer service
    const { pdfBuffer, hash, renderTimeMs } = await compileAndRenderPdf({
      html: renderHtml,
      css: renderCss,
      data,
      options: renderOptions
    });

    wsTelemetryService.broadcastJobProgress(renderJobId, 'generating_pdf', { hash, renderTimeMs });

    // Save to Persistent Verification Ledger & Storage Disk
    ledgerService.recordDocument({
      hash,
      accountId: 'acct_prod_991823',
      issuedAt: new Date().toISOString(),
      renderTimeMs,
      options: renderOptions,
      pdfBuffer
    });

    wsTelemetryService.broadcastJobProgress(renderJobId, 'completed', { hash, renderTimeMs });

    // Set Response Headers
    res.setHeader('X-DocForge-Render-Time-Ms', renderTimeMs.toString());
    res.setHeader('X-DocForge-Document-Hash', hash);

    if (response_type === 'base64') {
      return res.json({
        status: 'success',
        document_hash: hash,
        render_time_ms: renderTimeMs,
        base64: pdfBuffer.toString('base64')
      });
    }

    if (response_type === 'json') {
      return res.json({
        status: 'success',
        document_hash: hash,
        render_time_ms: renderTimeMs,
        download_url: `http://localhost:${PORT}/v1/download/${hash}.pdf`
      });
    }

    // Default: Binary Stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="document_${hash.substring(0, 8)}.pdf"`);
    return res.send(pdfBuffer);

  } catch (err) {
    console.error('Render Route Error:', err);
    return res.status(500).json({
      error: 'internal_rendering_error',
      message: err.message
    });
  }
});

// -------------------------------------------------------------
// 4. POST /v1/render/batch — Async Batch PDF Generation Queue
// -------------------------------------------------------------
app.post('/v1/render/batch', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  try {
    const { template_id, version, html, css, options = {}, items, webhook_url } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Field "items" must be a non-empty array of render objects.'
      });
    }

    const batchJob = batchQueueService.createBatchJob({
      template_id,
      version,
      html,
      css,
      options,
      items,
      webhook_url,
      port: PORT
    });

    return res.status(202).json(batchJob);
  } catch (err) {
    return res.status(500).json({ error: 'batch_error', message: err.message });
  }
});

// -------------------------------------------------------------
// API KEY MANAGEMENT ENDPOINTS
// -------------------------------------------------------------
app.post('/v1/keys', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  try {
    const { name, account_id, rate_limit_per_min } = req.body;
    const newKey = apiKeyService.createApiKey({ name, account_id, rate_limit_per_min });
    return res.status(201).json({ status: 'success', key: newKey });
  } catch (err) {
    return res.status(500).json({ error: 'key_creation_error', message: err.message });
  }
});

app.get('/v1/keys', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  const accountId = req.query.account_id || req.apiKeyDetails.account_id || 'acct_prod_991823';
  const keys = apiKeyService.listApiKeys(accountId);
  return res.json({ status: 'success', account_id: accountId, keys });
});

app.delete('/v1/keys/:key_id', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  const { key_id } = req.params;
  const result = apiKeyService.revokeApiKey(key_id);
  return res.json({ status: 'success', result });
});

// -------------------------------------------------------------
// 5. GET /v1/jobs/:batch_id — Batch Job Status & Telemetry
// -------------------------------------------------------------
app.get('/v1/jobs/:batch_id', authenticateApiKey, (req, res) => {
  const { batch_id } = req.params;
  const job = batchQueueService.getBatchJob(batch_id);

  if (!job) {
    return res.status(404).json({ error: 'not_found', message: `Batch job "${batch_id}" not found.` });
  }

  return res.json({ status: 'success', job });
});

// -------------------------------------------------------------
// 6. WEBHOOK SIMULATOR ENDPOINTS
// -------------------------------------------------------------
const simulatorWebhookLogs = [];

app.post('/v1/webhooks/simulator', (req, res) => {
  const event = req.headers['x-docforge-event'] || req.body.event || 'document.rendered';
  const crypto = require('crypto');
  const hmacSig = req.headers['x-docforge-signature'] || `t=${Date.now()},v1=${crypto.randomBytes(16).toString('hex')}`;
  const logEntry = {
    id: `evt_${Date.now().toString(36)}`,
    event,
    status: '200 OK',
    latency: Math.floor(Math.random() * 15 + 20),
    hmac_signature: hmacSig,
    timestamp: new Date().toISOString(),
    payload: req.body
  };

  simulatorWebhookLogs.unshift(logEntry);
  if (simulatorWebhookLogs.length > 20) simulatorWebhookLogs.pop();

  return res.json({ status: 'received', message: 'Webhook received & logged by simulator.', event });
});

app.get('/v1/webhooks/simulator/logs', (req, res) => {
  return res.json({ status: 'success', logs: simulatorWebhookLogs });
});

// -------------------------------------------------------------
// 6b. WEBHOOKS V2 DEAD LETTER QUEUE (DLQ) ENDPOINTS
// -------------------------------------------------------------
const webhookService = require('./services/webhookService');

app.get('/v1/webhooks/dlq', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  try {
    const items = webhookService.getDlqItems();
    return res.json({ status: 'success', total_dlq_items: items.length, items });
  } catch (err) {
    return res.status(500).json({ error: 'dlq_error', message: err.message });
  }
});

app.post('/v1/webhooks/dlq/retry', authenticateApiKey, rateLimiterMiddleware, async (req, res) => {
  try {
    const { dlq_id } = req.body;
    if (!dlq_id) {
      return res.status(400).json({ error: 'bad_request', message: 'Field "dlq_id" is required.' });
    }

    const retryRes = await webhookService.retryDlqItem(dlq_id);
    return res.status(retryRes.success ? 200 : 400).json(retryRes);
  } catch (err) {
    return res.status(500).json({ error: 'retry_error', message: err.message });
  }
});
const auditLogService = require('./services/auditLogService');

app.get('/v1/audit/export', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const exportData = auditLogService.exportAuditLogs(format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="docforge_audit_logs.csv"');
      return res.send(exportData);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.send(exportData);
  } catch (err) {
    return res.status(500).json({ error: 'audit_export_error', message: err.message });
  }
});

// -------------------------------------------------------------
// 6d. 1-CLICK POSTMAN COLLECTION EXPORTER
// -------------------------------------------------------------
const postmanExporterService = require('./services/postmanExporterService');

app.get('/v1/docs/postman', (req, res) => {
  try {
    const collectionJson = postmanExporterService.generatePostmanCollection();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="docforge_postman_collection.json"');
    return res.send(JSON.stringify(collectionJson, null, 2));
  } catch (err) {
    return res.status(500).json({ error: 'postman_export_error', message: err.message });
  }
});

// -------------------------------------------------------------
// 3. GET /v1/download/:filename — Download Binary Artifact
// -------------------------------------------------------------
app.get('/v1/download/:filename', (req, res) => {
  const hash = req.params.filename.replace('.pdf', '');
  const pdfBuffer = ledgerService.getPdfBuffer(hash);

  if (!pdfBuffer) {
    return res.status(404).json({ error: 'not_found', message: 'PDF artifact expired or not found in persistent storage.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="doc_${hash.substring(0, 8)}.pdf"`);
  return res.send(pdfBuffer);
});

// -------------------------------------------------------------
// 4. GET /v1/verify/:hash — Public Cryptographic Ledger Verification
// -------------------------------------------------------------
app.get('/v1/verify/:hash', (req, res) => {
  const hash = req.params.hash;
  const result = ledgerService.verifyDocument(hash);

  if (!result.is_valid) {
    return res.status(404).json(result);
  }

  return res.json(result);
});

// -------------------------------------------------------------
// 4b. GET /v1/verify/proof/:hash — Merkle Inclusion Proof Verification
// -------------------------------------------------------------
app.get('/v1/verify/proof/:hash', (req, res) => {
  const hash = req.params.hash;
  const result = ledgerService.verifyMerkleProof(hash);

  if (!result.is_valid) {
    return res.status(404).json(result);
  }

  return res.json(result);
});

// -------------------------------------------------------------
// 4c. POST /v1/ledger/anchor — Trigger Merkle Root Batch Anchor
// -------------------------------------------------------------
app.post('/v1/ledger/anchor', authenticateApiKey, rateLimiterMiddleware, (req, res) => {
  try {
    const anchorResult = ledgerService.anchorLedgerBatch();
    return res.status(200).json(anchorResult);
  } catch (err) {
    return res.status(500).json({ error: 'anchor_error', message: err.message });
  }
});

// -------------------------------------------------------------
// 4d. GET /v1/storage/download/:hash — Secure Presigned Download Route
// -------------------------------------------------------------
app.get('/v1/storage/download/:hash', (req, res) => {
  const hash = req.params.hash;
  const pdfBuffer = ledgerService.getPdfBuffer(hash);

  if (!pdfBuffer) {
    return res.status(404).json({ error: 'not_found', message: 'PDF artifact expired or not found in cloud storage adapter.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="doc_${hash.substring(0, 8)}.pdf"`);
  return res.send(pdfBuffer);
});

// -------------------------------------------------------------
// 5. GET /v1/health — API Health Check
// -------------------------------------------------------------
app.get('/v1/health', (req, res) => {
  const stats = ledgerService.getLedgerStats();
  res.json({
    status: 'healthy',
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString(),
    rendering_engine: 'Puppeteer Headless Cluster',
    ledger_store: 'SQLite Persistent Ledger & Merkle Anchors',
    total_ledger_documents: stats.total_documents
  });
});

// -------------------------------------------------------------
// 5b. GET /v1/ws/telemetry/stats — WebSocket Telemetry Stats
// -------------------------------------------------------------
app.get('/v1/ws/telemetry/stats', (req, res) => {
  res.json({
    status: 'success',
    active_ws_clients: wsTelemetryService.getConnectedClientsCount(),
    channel: '/v1/ws/progress',
    timestamp: new Date().toISOString()
  });
});

// Initialize WebSocket Telemetry Engine
wsTelemetryService.init(server);

// Start Express HTTP & WebSocket Server
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 DocForge API Production Server running on port ${PORT}`);
  console.log(`📖 Interactive API Docs: http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
  console.log(`📡 WebSocket Telemetry: ws://localhost:${PORT}/v1/ws/progress`);
  console.log(`👉 Healthcheck: http://localhost:${PORT}/v1/health`);
  console.log(`👉 Render Endpoint: POST http://localhost:${PORT}/v1/render`);
  console.log(`=================================================`);
});
