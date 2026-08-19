const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'docforge_ledger.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Create audit_logs table schema
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    log_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    account_id TEXT NOT NULL,
    resource_id TEXT,
    details_json TEXT,
    timestamp TEXT NOT NULL
  );
`);

const insertAuditStmt = db.prepare(`
  INSERT INTO audit_logs (log_id, event_type, account_id, resource_id, details_json, timestamp)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const selectAllAuditStmt = db.prepare(`
  SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000
`);

/**
 * Records an immutable audit log event for SOC2 compliance
 */
function recordAuditEvent({ eventType, accountId = 'acct_prod_991823', resourceId = null, details = {} }) {
  const logId = `audit_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = new Date().toISOString();
  const detailsJson = JSON.stringify(details);

  try {
    insertAuditStmt.run(logId, eventType, accountId, resourceId, detailsJson, timestamp);
  } catch (err) {
    console.error('Audit Log Insertion Error:', err.message);
  }

  return { log_id: logId, timestamp };
}

/**
 * Exports audit logs as JSON or CSV formatted string
 * @param {string} [format='json'] - 'json' or 'csv'
 * @returns {string} Formatted log export
 */
function exportAuditLogs(format = 'json') {
  const rows = selectAllAuditStmt.all();

  if (format === 'csv') {
    const headers = ['log_id', 'event_type', 'account_id', 'resource_id', 'timestamp', 'details'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const detailsClean = (r.details_json || '').replace(/"/g, '""');
      const line = [
        `"${r.log_id}"`,
        `"${r.event_type}"`,
        `"${r.account_id}"`,
        `"${r.resource_id || ''}"`,
        `"${r.timestamp}"`,
        `"${detailsClean}"`
      ].join(',');
      csvLines.push(line);
    });

    return csvLines.join('\n');
  }

  // Default: JSON format
  return JSON.stringify({
    status: 'success',
    total_logs: rows.length,
    exported_at: new Date().toISOString(),
    logs: rows.map(r => ({
      log_id: r.log_id,
      event_type: r.event_type,
      account_id: r.account_id,
      resource_id: r.resource_id,
      details: JSON.parse(r.details_json || '{}'),
      timestamp: r.timestamp
    }))
  }, null, 2);
}

module.exports = {
  recordAuditEvent,
  exportAuditLogs
};
