import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_BASE_URL = 'https://quizzviz-backend-production.up.railway.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet();
      case 'POST':
        return handlePost();
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err: any) {
    console.error(`API error in /api/quizzes (${req.method}):`, err);
    return res.status(500).json({ 
      error: err?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  async function handleGet() {
    const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${encodeURIComponent(userIdStr)}/quizzes`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to fetch quizzes');
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  }

  async function handlePost() {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${encodeURIComponent(userIdStr)}/quizz`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to create quiz');
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(201).json(data);
  }
}
