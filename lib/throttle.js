/**
 * Simple in-memory login throttling
 * Tracks attempts by IP address and username combination
 * Max 5 attempts per 10 minutes
 */

const attempts = new Map(); // Key: "ip:username", Value: array of timestamps

// Clean up old attempts periodically (every 5 minutes)
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, timestamps] of attempts.entries()) {
    const filtered = timestamps.filter(ts => ts > tenMinutesAgo);
    if (filtered.length === 0) {
      attempts.delete(key);
    } else {
      attempts.set(key, filtered);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

/**
 * Check if login attempt should be allowed
 * @param {string} ip - IP address
 * @param {string} username - Username
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
function checkLoginThrottle(ip, username) {
  const key = `${ip}:${username}`;
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  
  // Get existing attempts for this IP:username combination
  const existingAttempts = attempts.get(key) || [];
  
  // Filter out attempts older than 10 minutes
  const recentAttempts = existingAttempts.filter(ts => ts > tenMinutesAgo);
  
  // Update the map with filtered attempts
  attempts.set(key, recentAttempts);
  
  // Check if limit exceeded
  if (recentAttempts.length >= 5) {
    // Find the oldest attempt in the recent window to calculate reset time
    const oldestAttempt = Math.min(...recentAttempts);
    const resetAt = oldestAttempt + 10 * 60 * 1000;
    return {
      allowed: false,
      remaining: 0,
      resetAt: resetAt
    };
  }
  
  // Record this attempt
  recentAttempts.push(Date.now());
  attempts.set(key, recentAttempts);
  
  return {
    allowed: true,
    remaining: 5 - recentAttempts.length,
    resetAt: null
  };
}

/**
 * Reset throttling for a specific IP:username combination (for successful logins)
 * @param {string} ip - IP address
 * @param {string} username - Username
 */
function resetLoginThrottle(ip, username) {
  const key = `${ip}:${username}`;
  attempts.delete(key);
}

// Export as CommonJS for require() usage
module.exports = { checkLoginThrottle, resetLoginThrottle };

