const { WebSocketServer } = require('ws');

let wss = null;
const clients = new Set();

function init(server) {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (pathname === '/v1/ws/progress') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request) => {
    clients.add(ws);
    
    // Send initial handshake acknowledgement
    ws.send(JSON.stringify({
      event: 'connected',
      status: 'success',
      channel: '/v1/ws/progress',
      timestamp: new Date().toISOString(),
      message: 'Connected to DocForge v2.5.0 WebSocket Telemetry Engine.'
    }));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  console.log('📡 DocForge WebSocket Telemetry Engine initialized on /v1/ws/progress');
}

function broadcast(event, payload = {}) {
  if (!wss) return;
  const message = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...payload
  });

  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  }
}

function broadcastJobProgress(jobId, stage, metadata = {}) {
  broadcast('render.progress', {
    job_id: jobId,
    stage, // 'queued' | 'rendering_html' | 'generating_pdf' | 'ledger_recorded' | 'completed'
    metadata
  });
}

function getConnectedClientsCount() {
  return clients.size;
}

module.exports = {
  init,
  broadcast,
  broadcastJobProgress,
  getConnectedClientsCount
};
