const keyWindows = new Map();

/**
 * Sliding 1-minute window rate limiter middleware
 */
function rateLimiterMiddleware(req, res, next) {
  const apiKeyObj = req.apiKeyDetails;
  if (!apiKeyObj) {
    return next();
  }

  const apiKey = apiKeyObj.api_key;
  const limit = apiKeyObj.rate_limit_per_min || 100;
  const now = Date.now();

  let window = keyWindows.get(apiKey);
  if (!window || now > window.resetTime) {
    window = { count: 0, resetTime: now + 60000 };
    keyWindows.set(apiKey, window);
  }

  window.count++;
  const remaining = Math.max(0, limit - window.count);
  const resetSeconds = Math.ceil((window.resetTime - now) / 1000);

  // Set standard rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

  if (window.count > limit) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Rate limit exceeded for API key "${apiKeyObj.name || apiKeyObj.key_id}". Maximum ${limit} requests per minute allowed.`,
      rate_limit_per_min: limit,
      reset_in_seconds: resetSeconds
    });
  }

  next();
}

/**
 * Clears rate limiter window for testing
 */
function resetRateLimiter() {
  keyWindows.clear();
}

module.exports = {
  rateLimiterMiddleware,
  resetRateLimiter
};
