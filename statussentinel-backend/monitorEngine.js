const http = require('http');
const https = require('https');
const db = require('./sentinelDb');
const alertDispatcher = require('./alertDispatcher');

/**
 * Ping an HTTP/HTTPS endpoint and measure latency (ms) & status
 */
function pingEndpoint(targetUrl) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let lib = targetUrl.startsWith('https') ? https : http;

    const req = lib.get(targetUrl, { timeout: 4000, headers: { 'User-Agent': 'StatusSentinel-PingWorker/1.0' } }, (res) => {
      const latencyMs = Date.now() - startTime;
      resolve({
        success: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
        latencyMs
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        statusCode: 0,
        latencyMs: Date.now() - startTime,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 408,
        latencyMs: Date.now() - startTime,
        error: 'Timeout'
      });
    });
  });
}

/**
 * Execute a single monitor check run
 */
async function checkMonitor(monitor) {
  const result = await pingEndpoint(monitor.url);
  const isUp = result.success;

  let consecutiveFailures = isUp ? 0 : (monitor.consecutive_failures || 0) + 1;
  let newStatus = isUp ? 'UP' : (consecutiveFailures >= 2 ? 'DOWN' : monitor.status || 'UP');

  const oldStatus = monitor.status;
  const updatedMonitor = {
    ...monitor,
    status: newStatus,
    latency_ms: result.latencyMs,
    last_checked: new Date().toISOString(),
    consecutive_failures: consecutiveFailures,
    ssl_days_remaining: monitor.ssl_days_remaining || 180
  };

  db.saveMonitor(updatedMonitor);

  // Detect State Change -> Dispatch Alert
  if (oldStatus && oldStatus !== newStatus) {
    console.log(`⚡ [SENTINEL ALERT] Monitor ${monitor.name} state changed: ${oldStatus} -> ${newStatus}`);
    
    const incidentData = {
      event: newStatus,
      monitor_id: monitor.id,
      monitor_name: monitor.name,
      url: monitor.url,
      latency_ms: result.latencyMs,
      http_status: result.statusCode,
      message: newStatus === 'DOWN' 
        ? `Service ${monitor.name} failed 2 consecutive healthchecks.` 
        : `Service ${monitor.name} has recovered.`
    };

    // Log Incident in DB
    db.addIncident({
      id: `inc_${Date.now()}`,
      title: `${newStatus === 'DOWN' ? 'Outage' : 'Recovery'}: ${monitor.name}`,
      status: newStatus === 'DOWN' ? 'INVESTIGATING' : 'RESOLVED',
      impact: newStatus === 'DOWN' ? 'MAJOR' : 'NONE',
      description: incidentData.message,
      monitors_affected: [monitor.id],
      updates: [{
        timestamp: new Date().toISOString(),
        status: newStatus === 'DOWN' ? 'INVESTIGATING' : 'RESOLVED',
        message: incidentData.message
      }],
      created_at: new Date().toISOString()
    });

    // Dispatch Alerts
    if (monitor.discord_webhook) {
      await alertDispatcher.dispatchDiscordAlert(monitor.discord_webhook, incidentData);
    }
    if (monitor.telegram_bot_token && monitor.telegram_chat_id) {
      await alertDispatcher.dispatchTelegramAlert(monitor.telegram_bot_token, monitor.telegram_chat_id, incidentData);
    }
  }

  return updatedMonitor;
}

let timerHandle = null;

function startEngine(intervalMs = 30000) {
  console.log('⚡ StatusSentinel Monitoring Engine started (interval: 30s)');
  
  // Initial check
  runAllChecks();

  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(runAllChecks, intervalMs);
}

async function runAllChecks() {
  const monitors = db.getMonitors();
  for (const mon of monitors) {
    try {
      await checkMonitor(mon);
    } catch (e) {
      console.warn(`Error checking monitor ${mon.id}:`, e.message);
    }
  }
}

function stopEngine() {
  if (timerHandle) clearInterval(timerHandle);
}

module.exports = {
  pingEndpoint,
  checkMonitor,
  runAllChecks,
  startEngine,
  stopEngine
};
