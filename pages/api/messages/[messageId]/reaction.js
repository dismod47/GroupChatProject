const data = require('@/lib/data');
const { isMaintenanceMode } = require('@/lib/maintenance');

export default async function handler(req, res) {
  // Check maintenance mode for write operations
  if (req.method === 'POST' && isMaintenanceMode()) {
    return res.status(503).json({
      error: 'Maintenance in progress',
      message: 'Maintenance in progress—please try again soon'
    });
  }

  const { messageId } = req.query;

  if (req.method === 'POST') {
    try {
      const { userName, emoji } = req.body;

      if (!userName || !emoji) {
        return res.status(400).json({ error: 'Missing userName or emoji' });
      }

      const result = await data.toggleReaction(messageId, userName, emoji);
      
      if (result.error) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return res.status(500).json({ error: 'Failed to toggle reaction' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

