/**
 * Simple in-memory cache with TTL (Time To Live)
 * Used for public read-only API responses
 */

const crypto = require('crypto');

const cache = new Map(); // Key: route, Value: { data, etag, expiresAt }

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate ETag from data
 * @param {any} data - Data to generate ETag from
 * @returns {string} ETag value
 */
function generateETag(data) {
  const str = JSON.stringify(data);
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `"${hash}"`;
}

/**
 * Get cached response if available and not expired
 * @param {string} key - Cache key
 * @param {string} ifNoneMatch - If-None-Match header value
 * @returns {Object|null} { data, etag } or null if not cached/expired
 */
function getCache(key, ifNoneMatch) {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }

  // Check if expired
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  // Check ETag match (304 Not Modified)
  if (ifNoneMatch && ifNoneMatch === entry.etag) {
    return { data: null, etag: entry.etag, notModified: true };
  }

  return { data: entry.data, etag: entry.etag, notModified: false };
}

/**
 * Set cache entry
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 60)
 * @returns {string} ETag value
 */
function setCache(key, data, ttlSeconds = 60) {
  const etag = generateETag(data);
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  
  cache.set(key, {
    data,
    etag,
    expiresAt,
  });

  return etag;
}

/**
 * Clear cache entry
 * @param {string} key - Cache key (optional, clears all if not provided)
 */
function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

module.exports = {
  getCache,
  setCache,
  clearCache,
  generateETag,
};

