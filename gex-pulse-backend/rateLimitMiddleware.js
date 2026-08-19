const apiKeyService = require('./apiKeyService');

// Request tracking store: key/ip -> { count: number, resetTime: number }
const windowStore = new Map();

function rateLimitMiddleware(req, res, next) {
  // Allow healthcheck and static assets without rate limits
  if (req.path === '/v1/health' || !req.path.startsWith('/v1/')) {
    return next();
  }

  const apiKey = req.headers['x-gex-key'] || req.query.api_key;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  let apiKeyRecord = null;
  if (apiKey) {
    apiKeyRecord = apiKeyService.validateApiKey(apiKey, clientIp);
  }

  const identifier = apiKeyRecord ? `key:${apiKeyRecord.key}` : `ip:${clientIp}`;
  
  let limit = 60; // Anonymous baseline
  if (apiKeyRecord) {
    limit = apiKeyRecord.plan === 'pro_quant' ? 1000 : 120;
  }

  const now = Date.now();
  const windowMs = 60 * 1000;

  let current = windowStore.get(identifier);
  if (!current || now > current.resetTime) {
    current = { count: 0, resetTime: now + windowMs };
    windowStore.set(identifier, current);
  }

  current.count += 1;
  const remaining = Math.max(0, limit - current.count);
  const resetEpochSec = Math.ceil(current.resetTime / 1000);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetEpochSec);

  if (current.count > limit) {
    return res.status(429).json({
      status: 'error',
      error: 'rate_limit_exceeded',
      message: `Rate limit of ${limit} req/min exceeded for your tier (${apiKeyRecord ? apiKeyRecord.plan : 'anonymous'}).`,
      tier: apiKeyRecord ? apiKeyRecord.plan : 'anonymous',
      limit,
      reset_at: new Date(current.resetTime).toISOString()
    });
  }

  next();
}

module.exports = rateLimitMiddleware;
