const crypto = require('crypto');
const gexDatabase = require('./gexDatabase');

function provisionApiKey(plan = 'pro_quant', name = 'Subscribed Quant Client') {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const key = `gex_live_${randomBytes}`;
  const keyId = `key_${crypto.randomBytes(6).toString('hex')}`;

  const record = {
    key_id: keyId,
    key: key,
    plan: plan,
    name: name,
    created_at: new Date().toISOString(),
    last_used_at: null,
    last_ip: null,
    requests_today: 0,
    rate_limit_per_min: plan === 'pro_quant' ? 1000 : 120,
    webhooks: {
      discord: '',
      telegram_chat_id: '',
      telegram_bot_token: ''
    }
  };

  gexDatabase.setApiKeyRecord(key, record);
  return record;
}

function validateApiKey(key, clientIp = '127.0.0.1') {
  if (!key) return null;
  const record = gexDatabase.getApiKeyRecord(key);
  if (!record) return null;

  record.requests_today = (record.requests_today || 0) + 1;
  record.last_used_at = new Date().toISOString();
  record.last_ip = clientIp;
  if (!record.webhooks) {
    record.webhooks = { discord: '', telegram_chat_id: '', telegram_bot_token: '' };
  }

  gexDatabase.setApiKeyRecord(key, record);
  return record;
}

function updateApiKeyWebhooks(key, { type, target, botToken = '' }) {
  const record = gexDatabase.getApiKeyRecord(key);
  if (!record) return null;

  if (!record.webhooks) {
    record.webhooks = { discord: '', telegram_chat_id: '', telegram_bot_token: '' };
  }

  if (type === 'discord') record.webhooks.discord = target;
  else if (type === 'telegram') {
    record.webhooks.telegram_chat_id = target;
    if (botToken) record.webhooks.telegram_bot_token = botToken;
  }

  gexDatabase.setApiKeyRecord(key, record);
  return record;
}

function findApiKeyByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const keysObj = gexDatabase.getApiKeys();
  const records = Object.values(keysObj);
  return records.find(k => k.name.toLowerCase().includes(cleanEmail)) || null;
}

function listApiKeys() {
  const keysObj = gexDatabase.getApiKeys();
  return Object.values(keysObj).map(k => ({
    key_id: k.key_id,
    key_masked: `${k.key.substring(0, 12)}...`,
    plan: k.plan,
    name: k.name,
    created_at: k.created_at,
    last_used_at: k.last_used_at || 'Never',
    last_ip: k.last_ip || 'N/A',
    requests_today: k.requests_today || 0,
    webhooks: k.webhooks || {}
  }));
}

module.exports = {
  provisionApiKey,
  validateApiKey,
  updateApiKeyWebhooks,
  findApiKeyByEmail,
  listApiKeys
};
