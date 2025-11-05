const data = require('@/lib/data');
const { getCache, setCache } = require('@/lib/cache');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const cacheKey = 'api/courses';
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

      // Fetch fresh data
      const courses = await data.getAllCourses();
      const responseData = { courses };
      
      // Cache for 60 seconds
      const etag = setCache(cacheKey, responseData, 60);
      
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }
  }
  
  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}

