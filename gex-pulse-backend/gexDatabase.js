const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'gex_pulse_store.json');

// Default initial database state
const defaultState = {
  api_keys: {
    'gex_live_pro_master_key_991823': {
      key_id: 'key_master_001',
      key: 'gex_live_pro_master_key_991823',
      plan: 'pro_quant',
      name: 'Master Pro Quant Trader Account',
      created_at: new Date().toISOString(),
      requests_today: 42,
      rate_limit_per_min: 1000
    }
  },
  subscriptions: []
};

let dbState = null;

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(data);
      if (!dbState.api_keys) dbState.api_keys = {};
      if (!dbState.subscriptions) dbState.subscriptions = [];
      // Ensure master key exists
      if (!dbState.api_keys['gex_live_pro_master_key_991823']) {
        dbState.api_keys['gex_live_pro_master_key_991823'] = defaultState.api_keys['gex_live_pro_master_key_991823'];
      }
    } else {
      dbState = JSON.parse(JSON.stringify(defaultState));
      saveDatabase();
    }
  } catch (err) {
    console.warn('Database load error, resetting to default state:', err.message);
    dbState = JSON.parse(JSON.stringify(defaultState));
  }
}

function saveDatabase() {
  try {
    if (!dbState) return;
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(dbState, null, 2), 'utf8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Failed to save database to disk:', err.message);
  }
}

// Initialize on module load
loadDatabase();

module.exports = {
  getApiKeys: () => {
    if (!dbState) loadDatabase();
    return dbState.api_keys;
  },
  getApiKeyRecord: (key) => {
    if (!dbState) loadDatabase();
    return dbState.api_keys[key] || null;
  },
  setApiKeyRecord: (key, record) => {
    if (!dbState) loadDatabase();
    dbState.api_keys[key] = record;
    saveDatabase();
  },
  getSubscriptions: () => {
    if (!dbState) loadDatabase();
    return dbState.subscriptions;
  },
  addSubscription: (sub) => {
    if (!dbState) loadDatabase();
    dbState.subscriptions.push(sub);
    saveDatabase();
  },
  saveDatabase
};
