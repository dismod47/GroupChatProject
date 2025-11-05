const prisma = require('@/lib/prisma');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get reported messages from last 7 days that are not deleted or resolved
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reportedMessages = await prisma.message.findMany({
      where: {
        reported: true,
        deleted: false,
        timestamp: { gte: sevenDaysAgo },
      },
      include: {
        group: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Format for frontend
    const formatted = reportedMessages.map(msg => ({
      id: msg.id,
      text: msg.text,
      author: msg.author,
      timestamp: msg.timestamp,
      courseCode: msg.group.course.code,
      courseTitle: msg.group.course.title,
      groupId: msg.groupId,
      groupName: msg.group.name,
    }));

    return res.status(200).json({ messages: formatted });
  } catch (error) {
    console.error('Error fetching reported messages:', error);
    return res.status(500).json({ error: 'Failed to fetch reported messages' });
  }
}

