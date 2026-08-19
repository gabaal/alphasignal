const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'docforge_ledger.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite DB connection
const db = new DatabaseSync(DB_PATH);

// Initialize templates table
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    template_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    name TEXT NOT NULL,
    html TEXT NOT NULL,
    css TEXT,
    default_options_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (template_id, version)
  );
`);

// Prepared statements
const getLatestVersionStmt = db.prepare(`
  SELECT MAX(version) as max_version FROM templates WHERE template_id = ?
`);

const insertTemplateStmt = db.prepare(`
  INSERT INTO templates (template_id, version, name, html, css, default_options_json)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getTemplateByVersionStmt = db.prepare(`
  SELECT * FROM templates WHERE template_id = ? AND version = ?
`);

const getLatestTemplateStmt = db.prepare(`
  SELECT * FROM templates WHERE template_id = ? ORDER BY version DESC LIMIT 1
`);

const listTemplatesSummaryStmt = db.prepare(`
  SELECT 
    template_id, 
    name, 
    MAX(version) as latest_version, 
    COUNT(version) as total_versions,
    MAX(created_at) as last_updated_at
  FROM templates 
  GROUP BY template_id
`);

const getAllVersionsStmt = db.prepare(`
  SELECT version, name, created_at FROM templates WHERE template_id = ? ORDER BY version DESC
`);

/**
 * Saves a new template or increments version for an existing template_id
 */
function saveTemplate({ template_id, name, html, css = '', default_options = {} }) {
  if (!template_id || !name || !html) {
    throw new Error('Fields "template_id", "name", and "html" are required.');
  }

  // Get current max version
  const row = getLatestVersionStmt.get(template_id);
  const currentMaxVersion = row && row.max_version ? row.max_version : 0;
  const newVersion = currentMaxVersion + 1;

  const defaultOptionsJson = JSON.stringify(default_options);

  insertTemplateStmt.run(
    template_id,
    newVersion,
    name,
    html,
    css,
    defaultOptionsJson
  );

  return {
    template_id,
    version: newVersion,
    name,
    created_at: new Date().toISOString()
  };
}

/**
 * Gets template details. If version is null, returns the latest version.
 */
function getTemplate(template_id, version = null) {
  let row;
  if (version !== null && version !== undefined && version !== '') {
    row = getTemplateByVersionStmt.get(template_id, parseInt(version, 10));
  } else {
    row = getLatestTemplateStmt.get(template_id);
  }

  if (!row) {
    return null;
  }

  let default_options = {};
  try {
    default_options = JSON.parse(row.default_options_json || '{}');
  } catch (e) {
    default_options = {};
  }

  return {
    template_id: row.template_id,
    version: row.version,
    name: row.name,
    html: row.html,
    css: row.css || '',
    default_options,
    created_at: row.created_at
  };
}

/**
 * Lists all registered templates with their version summaries
 */
function listTemplates() {
  const rows = listTemplatesSummaryStmt.all();
  return rows.map(r => ({
    template_id: r.template_id,
    name: r.name,
    latest_version: r.latest_version,
    total_versions: r.total_versions,
    last_updated_at: r.last_updated_at
  }));
}

/**
 * Gets all version records for a specific template_id
 */
function getTemplateVersions(template_id) {
  return getAllVersionsStmt.all(template_id);
}

module.exports = {
  saveTemplate,
  getTemplate,
  listTemplates,
  getTemplateVersions
};
