const prisma = require('@/lib/prisma');
const data = require('@/lib/data');
const { getCache, setCache } = require('@/lib/cache');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const cacheKey = 'api/homepage';
      const ifNoneMatch = req.headers['if-none-match'];
      
      // Check cache
      const cached = getCache(cacheKey, ifNoneMatch);
      if (cached) {
        if (cached.notModified) {
          res.setHeader('ETag', cached.etag);
          res.setHeader('Cache-Control', 'public, max-age=60');
          return res.status(304).end();
        }
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.status(200).json(cached.data);
      }

      // Get all courses for search
      const courses = await data.getAllCourses();

      // Get active groups from last 24 hours (groups with recent messages or created recently)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Groups created in last 24h or with messages in last 24h
      const recentGroups = await prisma.group.findMany({
        where: {
          OR: [
            { createdAt: { gte: oneDayAgo } },
            {
              messages: {
                some: {
                  timestamp: { gte: oneDayAgo },
                  deleted: false,
                },
              },
            },
          ],
        },
        include: {
          course: true,
          members: true,
          _count: {
            select: {
              messages: {
                where: {
                  timestamp: { gte: oneDayAgo },
                  deleted: false,
                },
              },
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: 6, // Limit to 6 for homepage
      });

      // Get popular courses this week (courses with most groups or most activity)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Count groups per course created this week
      const courseGroups = await prisma.group.groupBy({
        by: ['courseCode'],
        where: {
          createdAt: { gte: oneWeekAgo },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 4,
      });

      const popularCourses = courseGroups.map(cg => {
        const course = courses.find(c => c.code === cg.courseCode);
        return course ? {
          code: course.code,
          title: course.title,
          groupCount: cg._count.id,
        } : null;
      }).filter(Boolean);

      const formattedGroups = recentGroups.map(g => ({
        id: g.id,
        name: g.name,
        courseCode: g.courseCode,
        courseTitle: g.course.title,
        memberCount: g.members.length,
        maxSize: 5,
        isOpen: g.isOpen,
        createdAt: g.createdAt.getTime(),
        recentMessageCount: g._count.messages,
      }));

      const responseData = {
        courses,
        popularCourses,
        recentGroups: formattedGroups,
      };

      // Cache for 60 seconds
      const etag = setCache(cacheKey, responseData, 60);
      
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      return res.status(500).json({ error: 'Failed to fetch homepage data' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}

