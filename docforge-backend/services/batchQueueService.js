const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { compileAndRenderPdf } = require('./pdfEngine');
const ledgerService = require('./ledgerService');
const templateService = require('./templateService');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'docforge_ledger.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite DB
const db = new DatabaseSync(DB_PATH);

// Initialize Batch Queue Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS batch_jobs (
    batch_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    webhook_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS batch_items (
    item_id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    custom_id TEXT,
    status TEXT NOT NULL,
    document_hash TEXT,
    download_url TEXT,
    error TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Prepared statements
const insertBatchJobStmt = db.prepare(`
  INSERT INTO batch_jobs (batch_id, status, total_items, webhook_url)
  VALUES (?, ?, ?, ?)
`);

const updateJobStatusStmt = db.prepare(`
  UPDATE batch_jobs SET status = ? WHERE batch_id = ?
`);

const incrementJobProgressStmt = db.prepare(`
  UPDATE batch_jobs SET processed_items = processed_items + 1 WHERE batch_id = ?
`);

const incrementJobFailedStmt = db.prepare(`
  UPDATE batch_jobs SET failed_items = failed_items + 1 WHERE batch_id = ?
`);

const completeJobStmt = db.prepare(`
  UPDATE batch_jobs SET status = 'completed', completed_at = ? WHERE batch_id = ?
`);

const insertBatchItemStmt = db.prepare(`
  INSERT INTO batch_items (item_id, batch_id, custom_id, status)
  VALUES (?, ?, ?, 'pending')
`);

const updateItemSuccessStmt = db.prepare(`
  UPDATE batch_items SET status = 'completed', document_hash = ?, download_url = ? WHERE item_id = ?
`);

const updateItemFailedStmt = db.prepare(`
  UPDATE batch_items SET status = 'failed', error = ? WHERE item_id = ?
`);

const selectJobStmt = db.prepare(`
  SELECT * FROM batch_jobs WHERE batch_id = ?
`);

const selectJobItemsStmt = db.prepare(`
  SELECT item_id, custom_id, status, document_hash, download_url, error FROM batch_items WHERE batch_id = ?
`);

/**
 * Creates and enqueues an asynchronous batch render job
 */
function createBatchJob({ template_id, version, html, css, options = {}, items = [], webhook_url = '', port = 4000 }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Field "items" must be a non-empty array of render objects.');
  }

  const batchId = `batch_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  // Insert Batch Job Row
  insertBatchJobStmt.run(batchId, 'pending', items.length, webhook_url || null);

  // Insert Item Rows
  items.forEach((item, idx) => {
    const itemId = `${batchId}_${idx + 1}`;
    const customId = item.id || item.custom_id || `item_${idx + 1}`;
    insertBatchItemStmt.run(itemId, batchId, customId);
  });

  // Trigger background execution loop asynchronously
  setImmediate(() => {
    processBatchJob(batchId, { template_id, version, html, css, options, items, webhook_url, port });
  });

  return {
    status: 'accepted',
    batch_id: batchId,
    total_items: items.length,
    status_url: `http://localhost:${port}/v1/jobs/${batchId}`
  };
}

/**
 * Background worker processing batch items
 */
async function processBatchJob(batchId, config) {
  const { template_id, version, html, css, options = {}, items = [], webhook_url, port } = config;

  updateJobStatusStmt.run('processing', batchId);

  // Resolve base template if template_id is specified
  let baseHtml = html;
  let baseCss = css || '';
  let baseOptions = { ...options };

  if (template_id) {
    const tmpl = templateService.getTemplate(template_id, version);
    if (tmpl) {
      if (!baseHtml) baseHtml = tmpl.html;
      if (!baseCss) baseCss = tmpl.css;
      baseOptions = { ...tmpl.default_options, ...baseOptions };
    }
  }

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const itemId = `${batchId}_${idx + 1}`;
    const itemData = item.data || item;
    const itemHtml = item.html || baseHtml;
    const itemCss = item.css || baseCss;
    const itemOptions = { ...baseOptions, ...(item.options || {}) };

    try {
      // Compile and render PDF
      const { pdfBuffer, hash, renderTimeMs } = await compileAndRenderPdf({
        html: itemHtml,
        css: itemCss,
        data: itemData,
        options: itemOptions
      });

      // Save to persistent document ledger
      ledgerService.recordDocument({
        hash,
        accountId: 'acct_prod_991823',
        issuedAt: new Date().toISOString(),
        renderTimeMs,
        options: itemOptions,
        pdfBuffer
      });

      const downloadUrl = `http://localhost:${port}/v1/download/${hash}.pdf`;

      // Update item row
      updateItemSuccessStmt.run(hash, downloadUrl, itemId);
      incrementJobProgressStmt.run(batchId);

    } catch (err) {
      console.error(`Batch Item ${itemId} Error:`, err.message);
      updateItemFailedStmt.run(err.message, itemId);
      incrementJobFailedStmt.run(batchId);
    }
  }

const webhookService = require('./webhookService');

  // Mark job as completed
  const completedAt = new Date().toISOString();
  completeJobStmt.run(completedAt, batchId);

  // Dispatch Webhooks v2 Notification with HMAC signature & exponential retries
  if (webhook_url) {
    const payload = {
      event: 'batch.completed',
      batch_id: batchId,
      total_items: items.length,
      completed_at: completedAt,
      status_url: `http://localhost:${port}/v1/jobs/${batchId}`
    };

    webhookService.dispatchWithRetry({
      webhookUrl: webhook_url,
      event: 'batch.completed',
      payload
    }).catch(wErr => {
      console.warn(`⚠️ Webhook v2 Dispatch Warning: ${wErr.message}`);
    });
  }
}

/**
 * Retrieves real-time batch job status and item details
 */
function getBatchJob(batchId) {
  const job = selectJobStmt.get(batchId);
  if (!job) return null;

  const items = selectJobItemsStmt.all(batchId);

  const progressPercent = job.total_items > 0 ? Math.round((job.processed_items / job.total_items) * 100) : 0;

  return {
    batch_id: job.batch_id,
    status: job.status,
    progress_percent: progressPercent,
    total_items: job.total_items,
    processed_items: job.processed_items,
    failed_items: job.failed_items,
    webhook_url: job.webhook_url,
    created_at: job.created_at,
    completed_at: job.completed_at,
    items
  };
}

module.exports = {
  createBatchJob,
  getBatchJob
};
