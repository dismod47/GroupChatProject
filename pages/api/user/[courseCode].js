const data = require('@/lib/data');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { courseCode } = req.query;
      const { userName } = req.query;

      if (!userName) {
        return res.status(200).json({ groupId: null });
      }

      const groupId = await data.isUserInGroup(courseCode, userName);
      return res.status(200).json({ groupId });
    } catch (error) {
      console.error('Error checking user group:', error);
      return res.status(500).json({ error: 'Failed to check user group' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}
