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
  const { groupId } = req.query;

  if (req.method === 'GET') {
    try {
      // Find course for this group
      const courses = await data.getAllCourses();
      let foundCourse = null;

      for (const course of courses) {
        const group = await data.getGroup(course.code, groupId);
        if (group) {
          foundCourse = course;
          break;
        }
      }

      if (!foundCourse) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const messages = await data.getMessages(foundCourse.code, groupId);
      return res.status(200).json({ messages: messages.messages || [] });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { courseCode, userName, text } = req.body;

      if (!courseCode || !userName || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await data.addMessage(courseCode, groupId, userName, text);
      if (result.error) {
        return res.status(400).json(result);
      }

      // Return updated messages
      const messages = await data.getMessages(courseCode, groupId);
      return res.status(200).json({
        message: result.message,
        messages: messages.messages || [],
      });
    } catch (error) {
      console.error('Error posting message:', error);
      return res.status(500).json({ error: 'Failed to post message' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
