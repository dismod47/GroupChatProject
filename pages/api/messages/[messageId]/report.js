const data = require('@/lib/data');
const { isMaintenanceMode } = require('@/lib/maintenance');

export default async function handler(req, res) {
  const { messageId } = req.query;

  if (req.method === 'POST') {
    // Check maintenance mode
    if (isMaintenanceMode()) {
      return res.status(503).json({
        error: 'Maintenance in progress',
        message: 'Maintenance in progress—please try again soon'
      });
    }

    try {
      const { courseCode, groupId, userName } = req.body;

      if (!courseCode || !groupId || !userName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await data.reportMessage(courseCode, groupId, messageId, userName);
      if (result.error) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error reporting message:', error);
      return res.status(500).json({ error: 'Failed to report message' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

