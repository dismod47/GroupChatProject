const prisma = require('@/lib/prisma');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userName } = req.query;

  if (!userName) {
    return res.status(400).json({ error: 'User name required' });
  }

  try {
    // Get most recent message by this user
    const lastMessage = await prisma.message.findFirst({
      where: {
        author: userName,
        deleted: false,
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        group: {
          include: {
            course: true,
          },
        },
      },
    });

    // Get all groups user is currently in
    const memberships = await prisma.groupMember.findMany({
      where: { userName },
      include: {
        group: {
          include: {
            course: true,
            members: true,
          },
        },
      },
      orderBy: {
        group: {
          createdAt: 'desc',
        },
      },
    });

    // Format current groups
    const currentGroups = memberships.map(m => ({
      groupId: m.group.id,
      groupName: m.group.name,
      courseCode: m.group.courseCode,
      courseTitle: m.group.course.title,
      isOpen: m.group.isOpen,
      size: m.group.members.length,
    }));

    // Get last group active in (from last message)
    let lastGroup = null;
    if (lastMessage && lastMessage.group && lastMessage.group.course) {
      lastGroup = {
        groupId: lastMessage.group.id,
        groupName: lastMessage.group.name,
        courseCode: lastMessage.group.course.code,
      };
    }

    return res.status(200).json({
      userName,
      lastActive: lastMessage ? lastMessage.timestamp.getTime() : null,
      lastGroup,
      currentGroups,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

