const data = require('@/lib/data');
const { checkLoginThrottle, resetLoginThrottle } = require('@/lib/throttle');

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  // Check various headers for IP (handles proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  // Fallback to connection remote address
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { userName, password, createIfNotExists } = req.body;

      if (!userName || !password) {
        return res.status(400).json({ error: 'Name and password are required' });
      }

      // Check login throttling
      const clientIP = getClientIP(req);
      const throttleCheck = checkLoginThrottle(clientIP, userName);
      
      if (!throttleCheck.allowed) {
        const resetInMinutes = Math.ceil((throttleCheck.resetAt - Date.now()) / (60 * 1000));
        return res.status(429).json({ 
          error: 'Too many attempts',
          message: 'Too many attempts—try again soon.',
          resetInMinutes: resetInMinutes
        });
      }

      const result = await data.authenticateUser(userName, password, createIfNotExists);
      
      if (result.error) {
        // Throttle was already checked and incremented above
        return res.status(400).json(result);
      }

      // Reset throttling on successful login
      resetLoginThrottle(clientIP, userName);

      return res.status(200).json({ userName: result.userName });
    } catch (error) {
      console.error('Error authenticating user:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ 
        error: 'Failed to authenticate',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

