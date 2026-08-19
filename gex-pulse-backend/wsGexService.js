const { WebSocketServer } = require('../docforge-backend/node_modules/ws');
const optionsDataFeed = require('./optionsDataFeed');
const apiKeyService = require('./apiKeyService');

let wss = null;
const clientsMap = new Map();
let broadcastInterval = null;

function init(server) {
  wss = new WebSocketServer({ server, path: '/ws/gex' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const apiKey = url.searchParams.get('api_key') || url.searchParams.get('key');
    const symbol = (url.searchParams.get('symbol') || 'SPX').toUpperCase();

    const apiKeyRecord = apiKey ? apiKeyService.validateApiKey(apiKey) : null;
    const isPro = !!apiKeyRecord;

    clientsMap.set(ws, { symbol, isPro, apiKeyRecord });

    // Send initial welcome frame
    ws.send(JSON.stringify({
      type: 'connection_established',
      service: 'GEX-Pulse WebSocket Telemetry Engine v1.0',
      symbol,
      is_pro: isPro,
      message: `Subscribed to real-time ${symbol} Dealer Gamma stream.`
    }));

    // Send initial snapshot
    optionsDataFeed.calculateGexProfile(symbol).then(gex => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'gex_tick', symbol, data: gex }));
      }
    }).catch(err => console.warn('WS Snapshot Error:', err.message));

    // Handle incoming client messages
    ws.on('message', async (message) => {
      try {
        const payload = JSON.parse(message.toString());
        const clientState = clientsMap.get(ws);
        if (!clientState) return;

        if (payload.action === 'subscribe' && payload.symbol) {
          clientState.symbol = payload.symbol.toUpperCase();
          const gex = await optionsDataFeed.calculateGexProfile(clientState.symbol);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
              type: 'subscription_changed',
              symbol: clientState.symbol,
              data: gex
            }));
          }
        } else if (payload.action === 'ping') {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        }
      } catch (err) {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON payload' }));
        }
      }
    });

    ws.on('close', () => {
      clientsMap.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('WS Client Error:', err.message);
      clientsMap.delete(ws);
    });
  });

  // Global Broadcasting Loop (Every 2,000ms)
  if (!broadcastInterval) {
    broadcastInterval = setInterval(async () => {
      if (clientsMap.size === 0) return;

      const symbols = new Set(Array.from(clientsMap.values()).map(c => c.symbol));
      const gexCache = new Map();

      for (const sym of symbols) {
        try {
          const profile = await optionsDataFeed.calculateGexProfile(sym);
          gexCache.set(sym, profile);
        } catch (e) {
          console.warn(`Error updating ${sym} GEX tick:`, e.message);
        }
      }

      for (const [ws, state] of clientsMap.entries()) {
        if (ws.readyState === ws.OPEN && gexCache.has(state.symbol)) {
          const data = gexCache.get(state.symbol);
          ws.send(JSON.stringify({
            type: 'gex_tick',
            symbol: state.symbol,
            timestamp: new Date().toISOString(),
            data
          }));
        }
      }
    }, 2000);
  }

  console.log('⚡ GEX-Pulse WebSocket Telemetry Engine mounted on /ws/gex');
}

function getConnectedClientsCount() {
  return clientsMap.size;
}

module.exports = {
  init,
  getConnectedClientsCount
};
