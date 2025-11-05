const data = require('@/lib/data');
const { isMaintenanceMode } = require('@/lib/maintenance');
const { clearCache } = require('@/lib/cache');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Check maintenance mode
    if (isMaintenanceMode()) {
      return res.status(503).json({
        error: 'Maintenance in progress',
        message: 'Maintenance in progress—please try again soon'
      });
    }

    try {
      const { courseCode, groupName, userName } = req.body;

      if (!courseCode || !groupName || !userName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await data.createGroup(courseCode, groupName, userName);
      if (result.error) {
        return res.status(400).json(result);
      }

      // Clear cache for affected endpoints
      clearCache('api/courses');
      clearCache(`api/courses/${courseCode}`);
      clearCache('api/homepage');

      return res.status(200).json({ group: result.group });
    } catch (error) {
      console.error('Error creating group:', error);
      return res.status(500).json({ error: 'Failed to create group' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
