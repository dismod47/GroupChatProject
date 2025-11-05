const prisma = require('@/lib/prisma');

export default async function handler(req, res) {
  const { messageId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mark message as resolved by setting reported to false
    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        reported: false,
      },
    });

    return res.status(200).json({ 
      success: true,
      message: 'Message marked as resolved' 
    });
  } catch (error) {
    console.error('Error resolving message:', error);
    return res.status(500).json({ error: 'Failed to resolve message' });
  }
}

