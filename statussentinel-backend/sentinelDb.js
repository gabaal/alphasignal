const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'sentinel_store.json');

const defaultDb = {
  monitors: [
    {
      id: 'mon_api_core',
      name: 'Primary API Gateway',
      url: 'https://httpbin.org/status/200',
      interval_seconds: 30,
      status: 'UP',
      latency_ms: 84,
      uptime_pct: 99.98,
      ssl_days_remaining: 184,
      last_checked: new Date().toISOString(),
      consecutive_failures: 0,
      created_at: new Date().toISOString()
    },
    {
      id: 'mon_auth_service',
      name: 'Auth & Identity Service',
      url: 'https://httpbin.org/status/200',
      interval_seconds: 60,
      status: 'UP',
      latency_ms: 112,
      uptime_pct: 100.0,
      ssl_days_remaining: 210,
      last_checked: new Date().toISOString(),
      consecutive_failures: 0,
      created_at: new Date().toISOString()
    },
    {
      id: 'mon_billing_engine',
      name: 'Stripe Billing Webhook Listener',
      url: 'https://httpbin.org/status/200',
      interval_seconds: 60,
      status: 'UP',
      latency_ms: 62,
      uptime_pct: 99.95,
      ssl_days_remaining: 145,
      last_checked: new Date().toISOString(),
      consecutive_failures: 0,
      created_at: new Date().toISOString()
    }
  ],
  status_pages: [
    {
      id: 'page_default',
      slug: 'default',
      title: 'AlphaSignal Global System Status',
      company_name: 'AlphaSignal Technologies',
      logo_url: '/favicon.png',
      announcement: 'All systems are operating normally across global regions.',
      monitors: ['mon_api_core', 'mon_auth_service', 'mon_billing_engine'],
      is_public: true,
      custom_css: '',
      created_at: new Date().toISOString()
    }
  ],
  incidents: [
    {
      id: 'inc_101',
      title: 'Scheduled Database Maintenance',
      status: 'RESOLVED',
      impact: 'MINOR',
      description: 'Database optimization routine completed successfully with zero dropped packets.',
      monitors_affected: ['mon_api_core'],
      updates: [
        {
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          status: 'RESOLVED',
          message: 'Maintenance complete. Performance restored to 100% capacity.'
        },
        {
          timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
          status: 'IN_PROGRESS',
          message: 'Executing index rebalancing on primary cluster.'
        }
      ],
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ],
  api_keys: [
    {
      key: 'sentinel_live_demo_key_99',
      plan: 'pro',
      name: 'Pro Sentinel API Key',
      created_at: new Date().toISOString()
    }
  ],
  subscriptions: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('⚠️ Could not parse sentinel_store.json, initializing fresh store:', err.message);
  }
  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Failed to save sentinelDb store:', err.message);
  }
}

// Data Access API
function getMonitors() {
  const db = loadDb();
  return db.monitors;
}

function getMonitorById(id) {
  const monitors = getMonitors();
  return monitors.find(m => m.id === id);
}

function saveMonitor(monitorData) {
  const db = loadDb();
  const existingIdx = db.monitors.findIndex(m => m.id === monitorData.id);
  if (existingIdx >= 0) {
    db.monitors[existingIdx] = { ...db.monitors[existingIdx], ...monitorData };
  } else {
    db.monitors.push(monitorData);
  }
  saveDb(db);
  return monitorData;
}

function deleteMonitor(id) {
  const db = loadDb();
  db.monitors = db.monitors.filter(m => m.id !== id);
  saveDb(db);
  return true;
}

function getStatusPageBySlug(slug) {
  const db = loadDb();
  return db.status_pages.find(p => p.slug === slug) || db.status_pages[0];
}

function saveStatusPage(pageData) {
  const db = loadDb();
  const existingIdx = db.status_pages.findIndex(p => p.id === pageData.id || p.slug === pageData.slug);
  if (existingIdx >= 0) {
    db.status_pages[existingIdx] = { ...db.status_pages[existingIdx], ...pageData };
  } else {
    db.status_pages.push(pageData);
  }
  saveDb(db);
  return pageData;
}

function getIncidents() {
  const db = loadDb();
  return db.incidents;
}

function addIncident(incidentData) {
  const db = loadDb();
  db.incidents.unshift(incidentData);
  saveDb(db);
  return incidentData;
}

function getApiKeys() {
  const db = loadDb();
  return db.api_keys;
}

function addApiKey(keyObj) {
  const db = loadDb();
  db.api_keys.push(keyObj);
  saveDb(db);
  return keyObj;
}

function addSubscription(subObj) {
  const db = loadDb();
  db.subscriptions.push(subObj);
  saveDb(db);
  return subObj;
}

module.exports = {
  loadDb,
  saveDb,
  getMonitors,
  getMonitorById,
  saveMonitor,
  deleteMonitor,
  getStatusPageBySlug,
  saveStatusPage,
  getIncidents,
  addIncident,
  getApiKeys,
  addApiKey,
  addSubscription
};
