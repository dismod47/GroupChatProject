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

      // Admin can delete without courseCode/groupId
      if (userName !== 'admin' && (!courseCode || !groupId || !userName)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // For admin, get the message to find groupId
      let finalGroupId = groupId;
      if (userName === 'admin' && !groupId) {
        const prisma = require('@/lib/prisma');
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { groupId: true },
        });
        if (!message) {
          return res.status(404).json({ error: 'Message not found' });
        }
        finalGroupId = message.groupId;
      }

      const result = await data.deleteMessage(courseCode || '', finalGroupId, messageId, userName);
      if (result.error) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

