const data = require('@/lib/data');
const { getCache, setCache } = require('@/lib/cache');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { courseCode } = req.query;
      
      if (!courseCode) {
        return res.status(400).json({ error: 'Course code is required' });
      }

      const cacheKey = `api/courses/${courseCode}`;
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
      
      const course = await data.getCourse(courseCode);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      const groups = await data.getGroups(courseCode);
      const roster = await data.getRosterWithStatus(courseCode);
      
      const responseData = {
        course,
        groups,
        roster,
      };

      // Cache for 60 seconds
      const etag = setCache(cacheKey, responseData, 60);
      
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Error fetching course:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ 
        error: 'Failed to fetch course',
        message: error.message 
      });
    }
  }
  
  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}
