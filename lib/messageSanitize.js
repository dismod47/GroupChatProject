// Message sanitization utility
// Trims, strips HTML, caps at 500 chars, collapses whitespace

function sanitizeMessage(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = text.trim();

  // Strip HTML tags (basic regex - for production, consider a library like DOMPurify)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Decode HTML entities (basic common ones)
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Collapse repeated whitespace (spaces, tabs, newlines) to single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim again after collapsing whitespace
  sanitized = sanitized.trim();

  // Cap at 500 characters
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized;
}

module.exports = { sanitizeMessage };

