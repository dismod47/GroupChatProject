const data = require('@/lib/data');
const prisma = require('@/lib/prisma');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get all courses
      const courses = await data.getAllCourses();

      // Get all groups with member counts
      const allGroups = await prisma.group.findMany({
        include: {
          members: true,
          course: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get last activity (most recent message timestamp)
      const lastMessage = await prisma.message.findFirst({
        orderBy: {
          timestamp: 'desc',
        },
        select: {
          timestamp: true,
        },
      });

      // Get total users
      const totalUsers = await prisma.user.count();

      // Format groups data
      const groups = allGroups.map(group => ({
        id: group.id,
        name: group.name,
        courseCode: group.courseCode,
        courseTitle: group.course.title,
        memberCount: group.members.length,
        maxSize: 5,
        isOpen: group.isOpen,
        createdAt: group.createdAt.getTime(),
        messageCount: group._count.messages,
      }));

      // Calculate totals
      const totalGroups = groups.length;
      const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);
      const totalCourses = courses.length;
      const lastActivity = lastMessage ? lastMessage.timestamp.getTime() : null;

      // Calculate average group size
      const avgGroupSize = totalGroups > 0 ? (totalMembers / totalGroups).toFixed(1) : 0;

      // Calculate messages per day (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const messagesLast7Days = await prisma.message.count({
        where: {
          timestamp: {
            gte: sevenDaysAgo,
          },
          deleted: false,
        },
      });

      const messagesPerDay = (messagesLast7Days / 7).toFixed(1);

      return res.status(200).json({
        courses,
        groups,
        stats: {
          totalCourses,
          totalGroups,
          totalMembers,
          totalUsers,
          avgGroupSize,
          messagesPerDay,
          lastActivity,
        },
      });
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}

