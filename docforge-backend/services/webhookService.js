const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'docforge_ledger.db');
const WEBHOOK_SECRET = process.env.DOCFORGE_WEBHOOK_SECRET || 'df_whsec_99182310192381';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Create Webhook DLQ table schema
db.exec(`
  CREATE TABLE IF NOT EXISTS webhook_dlq (
    dlq_id TEXT PRIMARY KEY,
    event TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    attempts INTEGER NOT NULL,
    last_error TEXT,
    failed_at TEXT NOT NULL,
    status TEXT DEFAULT 'retained'
  );
`);

const insertDlqStmt = db.prepare(`
  INSERT OR REPLACE INTO webhook_dlq 
  (dlq_id, event, webhook_url, payload_json, attempts, last_error, failed_at, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectDlqStmt = db.prepare(`
  SELECT * FROM webhook_dlq ORDER BY failed_at DESC LIMIT 50
`);

const selectDlqItemStmt = db.prepare(`
  SELECT * FROM webhook_dlq WHERE dlq_id = ?
`);

const updateDlqStatusStmt = db.prepare(`
  UPDATE webhook_dlq SET status = ? WHERE dlq_id = ?
`);

/**
 * Computes cryptographic HMAC-SHA256 signature for webhook payload
 * @param {string} timestamp 
 * @param {string} payloadString 
 * @returns {string} Signature header string
 */
function generateSignature(timestamp, payloadString) {
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Dispatches webhook with exponential backoff retries and DLQ retention on failure
 * @param {Object} params
 * @param {string} params.webhookUrl 
 * @param {string} params.event 
 * @param {Object} params.payload 
 * @param {number} [maxAttempts=3] 
 */
async function dispatchWithRetry({ webhookUrl, event, payload, maxAttempts = 3 }) {
  const payloadString = JSON.stringify(payload);
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureHeader = generateSignature(timestamp, payloadString);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DocForge-Event': event,
          'X-DocForge-Signature': signatureHeader,
          'X-DocForge-Delivery-Attempt': attempt.toString()
        },
        body: payloadString
      });

      if (response.ok) {
        console.log(`✅ [Webhook v2] Dispatched "${event}" to ${webhookUrl} (Attempt ${attempt})`);
        return { success: true, attempts: attempt, signature: signatureHeader };
      } else {
        lastError = `HTTP ${response.status} ${response.statusText}`;
      }
    } catch (err) {
      lastError = err.message;
    }

    // Exponential Backoff Delay (100ms, 300ms, 600ms)
    if (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, attempt * 150));
    }
  }

  // Retain in Dead Letter Queue (DLQ) if all retries exhausted
  const dlqId = `dlq_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const failedAt = new Date().toISOString();

  insertDlqStmt.run(
    dlqId,
    event,
    webhookUrl,
    payloadString,
    maxAttempts,
    lastError || 'Unknown Error',
    failedAt,
    'retained'
  );

  console.warn(`⚠️ [Webhook v2] Failed all ${maxAttempts} attempts. Retained in DLQ: ${dlqId}`);
  return { success: false, dlq_id: dlqId, error: lastError };
}

/**
 * Returns active Dead Letter Queue entries
 */
function getDlqItems() {
  const rows = selectDlqStmt.all();
  return rows.map(r => ({
    dlq_id: r.dlq_id,
    event: r.event,
    webhook_url: r.webhook_url,
    payload: JSON.parse(r.payload_json),
    attempts: r.attempts,
    last_error: r.last_error,
    failed_at: r.failed_at,
    status: r.status
  }));
}

/**
 * Re-triggers a failed webhook dispatch from DLQ
 */
async function retryDlqItem(dlqId) {
  const item = selectDlqItemStmt.get(dlqId);
  if (!item) {
    return { success: false, message: `DLQ Item "${dlqId}" not found.` };
  }

  const payload = JSON.parse(item.payload_json);
  const result = await dispatchWithRetry({
    webhookUrl: item.webhook_url,
    event: item.event,
    payload,
    maxAttempts: 1
  });

  if (result.success) {
    updateDlqStatusStmt.run('resolved', dlqId);
    return { success: true, message: `DLQ item "${dlqId}" re-sent successfully!`, result };
  } else {
    return { success: false, message: `Retry failed: ${result.error}`, result };
  }
}

module.exports = {
  dispatchWithRetry,
  getDlqItems,
  retryDlqItem,
  generateSignature
};
