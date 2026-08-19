const https = require('https');
const http = require('http');
const optionsDataFeed = require('./optionsDataFeed');

// Subscriptions store: array of { id, type: 'discord'|'telegram', target: string, symbol: string }
const subscriptions = [];
// Cooldown map: key = `${symbol}_${breachType}`, value = timestamp
const cooldowns = new Map();
// Previous snapshot cache: symbol -> GEX profile
const previousSnapshots = new Map();

let monitorInterval = null;

/**
 * Dispatches Rich Telegram Message via Telegram Bot API (HTML parse mode)
 */
async function dispatchTelegramAlert(botToken, chatId, gex) {
  if (!botToken || !chatId) throw new Error('bot_token and chat_id are required for Telegram alerts.');

  const text = `⚡ <b>GEX-Pulse 0DTE Alert: ${gex.symbol} @ $${gex.spot_price.toLocaleString()}</b>\n\n` +
    `<b>Regime</b>: <code>${gex.regime}</code>\n${gex.regime_description}\n\n` +
    `🎯 <b>Call Wall</b>: <code>$${gex.call_wall.toLocaleString()}</code> | 🛡️ <b>Put Wall</b>: <code>$${gex.put_wall.toLocaleString()}</code>\n` +
    `🔄 <b>Zero-GEX Flip</b>: <code>$${gex.zero_gex_flip.toLocaleString()}</code> | 📊 <b>Net GEX</b>: <code>+${gex.net_gex_billions}B</code>\n` +
    `🔥 <b>Max Pain</b>: <code>$${gex.max_pain_strike.toLocaleString()}</code> | 📐 <b>Exp Move</b>: <code>${gex.expected_move_0dte}</code>\n` +
    `🛡️ <b>Condor Safety</b>: <code>${gex.condor_safety_score}%</code> | ⚡ <b>Squeeze Risk</b>: <code>${gex.gamma_squeeze_risk_index}</code>\n\n` +
    `🎯 <b>Setup</b>: <code>${gex.exact_strike_setup}</code>\n` +
    `💡 <b>Action</b>: ${gex.recommended_0dte_action}\n\n` +
    `<i>GEX-Pulse.io • Real-Time Institutional Dealer Gamma Engine</i>`;

  const isSimulator = botToken === 'simulator_token' || chatId === 'simulator_chat_id' || botToken.includes('simulator') || chatId.includes('simulator') || botToken.includes('test');
  if (isSimulator) {
    return { status: 'success', is_simulated: true, text_sent: text };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = JSON.stringify({
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ok === false) {
            return reject(new Error(`Telegram API Error (${json.error_code}): ${json.description}`));
          }
          resolve({ status: 'success', is_simulated: false, response: json, text_sent: text });
        } catch (e) {
          reject(new Error(`Failed to parse Telegram API response: ${data}`));
        }
      });
    });
    req.on('error', (err) => reject(new Error(`Telegram HTTP Error: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

/**
 * Register automated breach subscription
 */
function addSubscription(type, target, symbol = 'SPX', botToken = '') {
  const id = `sub_${Math.random().toString(36).substring(2, 10)}`;
  const record = { id, type, target, symbol: symbol.toUpperCase(), botToken, created_at: new Date().toISOString() };
  subscriptions.push(record);
  return record;
}

/**
 * Check level breaches and trigger automatic alerts
 */
async function checkBreachesForSymbol(symbol) {
  try {
    const current = await optionsDataFeed.calculateGexProfile(symbol);
    const previous = previousSnapshots.get(symbol);

    previousSnapshots.set(symbol, current);
    if (!previous) return; // Need baseline snapshot to detect delta breach

    const breachEvents = [];

    // 1. Regime Flip Detection
    if (previous.regime !== current.regime) {
      breachEvents.push({
        type: 'REGIME_FLIP',
        title: `🔄 REGIME FLIP DETECTED (${previous.regime} ➔ ${current.regime})`,
        gex: current
      });
    }

    // 2. Call Wall Breach
    if (previous.spot_price <= previous.call_wall && current.spot_price > current.call_wall) {
      breachEvents.push({
        type: 'CALL_WALL_BREACH',
        title: `🚀 CALL WALL BREAKOUT ($${current.spot_price} > $${current.call_wall})`,
        gex: current
      });
    }

    // 3. Put Wall Breach
    if (previous.spot_price >= previous.put_wall && current.spot_price < current.put_wall) {
      breachEvents.push({
        type: 'PUT_WALL_BREACH',
        title: `⚠️ PUT WALL BREAKDOWN ($${current.spot_price} < $${current.put_wall})`,
        gex: current
      });
    }

    // 4. Safety Score Drop Warning
    if (previous.condor_safety_score >= 50 && current.condor_safety_score < 50) {
      breachEvents.push({
        type: 'SAFETY_WARNING',
        title: `🛡️ CONDOR SAFETY DROP (< 50%: ${current.condor_safety_score}%)`,
        gex: current
      });
    }

    // Dispatch breach events to active subscriptions with 60s cooldown
    const now = Date.now();
    for (const event of breachEvents) {
      const cooldownKey = `${symbol}_${event.type}`;
      const lastFired = cooldowns.get(cooldownKey) || 0;

      if (now - lastFired < 60000) continue; // Cooldown active
      cooldowns.set(cooldownKey, now);

      console.log(`⚡ [AlertEngine Breach] ${event.title}`);

      // Dispatch to subscribed targets for this symbol
      const symbolSubs = subscriptions.filter(s => s.symbol === symbol || s.symbol === 'ALL');
      for (const sub of symbolSubs) {
        try {
          if (sub.type === 'telegram') {
            await dispatchTelegramAlert(sub.botToken, sub.target, current);
          }
        } catch (e) {
          console.warn(`[AlertEngine] Delivery failure to ${sub.type} (${sub.target}):`, e.message);
        }
      }
    }
  } catch (err) {
    console.warn(`[AlertEngine] Error checking breaches for ${symbol}:`, err.message);
  }
}

/**
 * Initialize Alert Engine Monitoring Loop
 */
function init() {
  if (!monitorInterval) {
    monitorInterval = setInterval(() => {
      ['SPX', 'QQQ', 'BTC'].forEach(sym => checkBreachesForSymbol(sym));
    }, 5000);
  }
  console.log('⚡ GEX-Pulse Automated Level Breach Alert Engine running.');
}

module.exports = {
  init,
  dispatchTelegramAlert,
  addSubscription,
  checkBreachesForSymbol,
  getSubscriptions: () => subscriptions
};
