const data = require('@/lib/data');
const { isMaintenanceMode } = require('@/lib/maintenance');
const { clearCache } = require('@/lib/cache');

export default async function handler(req, res) {
  // Check maintenance mode for write operations
  if ((req.method === 'POST' || req.method === 'PUT') && isMaintenanceMode()) {
    return res.status(503).json({
      error: 'Maintenance in progress',
      message: 'Maintenance in progress—please try again soon'
    });
  }
  const { groupId } = req.query;
  
  // Helper function to clear relevant caches
  function invalidateCaches(courseCode) {
    clearCache('api/courses');
    if (courseCode) {
      clearCache(`api/courses/${courseCode}`);
    }
    clearCache('api/homepage');
  }

  if (req.method === 'GET') {
    try {
      // Optimize: getGroup already searches all courses if not found in specified course
      // So we just call it once with any course code
      const group = await data.getGroup('', groupId);
      
      if (!group) {
        console.error('Group not found:', groupId);
        return res.status(404).json({ error: 'Group not found' });
      }

      // Get course info for this group
      const courses = await data.getAllCourses();
      const foundCourse = courses.find(c => c.code === group.courseCode);
      
      if (!foundCourse) {
        console.error('Course not found for group:', groupId, 'courseCode:', group.courseCode);
        return res.status(404).json({ error: 'Course not found' });
      }

      const messages = await data.getMessages(foundCourse.code, groupId);

      return res.status(200).json({
        group: {
          id: group.id,
          name: group.name,
          members: group.members,
          isOpen: group.isOpen,
          size: group.members.length,
          maxSize: 5,
          creatorName: group.creatorName,
        },
        course: foundCourse,
        messages: messages.messages || [],
      });
    } catch (error) {
      console.error('Error fetching group:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ error: 'Failed to fetch group' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Join group
      const { courseCode, userName } = req.body;

      if (!courseCode || !userName) {
        return res.status(400).json({ error: 'Missing courseCode or userName' });
      }

      const result = await data.joinGroup(courseCode, groupId, userName);
      if (result.error) {
        return res.status(400).json(result);
      }

      // Clear cache after successful join
      invalidateCaches(courseCode);

      return res.status(200).json({ group: result.group });
    } catch (error) {
      console.error('Error joining group:', error);
      return res.status(500).json({ error: 'Failed to join group' });
    }
  }

  if (req.method === 'PUT') {
    try {
      // Update group (toggle status, leave, etc.)
      const { courseCode, userName, action } = req.body;

      if (!courseCode || !userName || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (action === 'toggle') {
        const result = await data.toggleGroupStatus(courseCode, groupId, userName);
        if (result.error) {
          return res.status(400).json(result);
        }
        // Clear cache after status change
        invalidateCaches(courseCode);
        return res.status(200).json({ group: result.group });
      }

      if (action === 'leave') {
        const result = await data.leaveGroup(courseCode, groupId, userName);
        if (result.error) {
          return res.status(400).json(result);
        }
        // Clear cache after leaving (group might be deleted)
        invalidateCaches(courseCode);
        return res.status(200).json(result);
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      console.error('Error updating group:', error);
      return res.status(500).json({ error: 'Failed to update group' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).json({ error: 'Method not allowed' });
}
