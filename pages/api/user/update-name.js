const data = require('@/lib/data');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { oldUserName, newUserName, password } = req.body;

      if (!oldUserName || !newUserName || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (oldUserName.trim() === newUserName.trim()) {
        return res.status(400).json({ error: 'New name must be different from current name' });
      }

      const result = await data.updateUserName(oldUserName, newUserName, password);
      if (result.error) {
        return res.status(400).json(result);
      }

      return res.status(200).json({ userName: result.userName });
    } catch (error) {
      console.error('Error updating user name:', error);
      return res.status(500).json({ error: 'Failed to update user name' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

