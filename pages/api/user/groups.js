const data = require('@/lib/data');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { userName } = req.query;

      if (!userName) {
        return res.status(400).json({ error: 'userName is required' });
      }

      const userGroups = await data.getUserGroups(userName);
      return res.status(200).json({ groups: userGroups });
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return res.status(500).json({ error: 'Failed to fetch user groups' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}

