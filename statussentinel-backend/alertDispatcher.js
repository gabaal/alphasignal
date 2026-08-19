const https = require('https');
const http = require('http');

function sendHttpRequest(url, options = {}, payload = null) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (payload) {
      req.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
    req.end();
  });
}

/**
 * Dispatch Incident Alert to Discord Webhook
 */
async function dispatchDiscordAlert(webhookUrl, incidentData) {
  if (!webhookUrl || webhookUrl.includes('simulator')) {
    return { is_simulated: true, success: true, channel: 'discord' };
  }

  const isDown = incidentData.event === 'DOWN';
  const embed = {
    title: `${isDown ? '🔴 SYSTEM INCIDENT DETECTED' : '🟢 SYSTEM RECOVERED'}: ${incidentData.monitor_name}`,
    description: incidentData.message || (isDown ? 'Service endpoint is unreachable or returning non-2xx status.' : 'Service endpoint has recovered and is operational.'),
    color: isDown ? 0xF43F5E : 0x10B981,
    fields: [
      { name: 'Target URL', value: `\`${incidentData.url}\``, inline: true },
      { name: 'Latency', value: `\`${incidentData.latency_ms}ms\``, inline: true },
      { name: 'Status Code', value: `\`${incidentData.http_status || 'TIMEOUT'}\``, inline: true },
      { name: 'Timestamp', value: new Date().toUTCString(), inline: false }
    ],
    footer: { text: 'StatusSentinel.io • Micro-Service Monitor' }
  };

  try {
    const res = await sendHttpRequest(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { embeds: [embed] });
    return { is_simulated: false, success: res.status >= 200 && res.status < 300, statusCode: res.status };
  } catch (err) {
    return { is_simulated: false, success: false, error: err.message };
  }
}

/**
 * Dispatch Incident Alert to Telegram Bot API
 */
async function dispatchTelegramAlert(botToken, chatId, incidentData) {
  if (!botToken || botToken.includes('simulator') || !chatId) {
    return { is_simulated: true, success: true, channel: 'telegram' };
  }

  const isDown = incidentData.event === 'DOWN';
  const icon = isDown ? '🔴' : '🟢';
  const text = `${icon} *STATUSSENTINEL ALERT*: ${incidentData.monitor_name}\n` +
    `*Event*: ${incidentData.event}\n` +
    `*URL*: \`${incidentData.url}\`\n` +
    `*Latency*: ${incidentData.latency_ms}ms\n` +
    `*Status*: ${incidentData.http_status || 'TIMEOUT'}\n` +
    `*Time*: ${new Date().toISOString()}`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await sendHttpRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    });
    return { is_simulated: false, success: res.status === 200 };
  } catch (err) {
    return { is_simulated: false, success: false, error: err.message };
  }
}

module.exports = {
  dispatchDiscordAlert,
  dispatchTelegramAlert
};
