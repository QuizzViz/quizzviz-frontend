import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_BASE_URL = 'https://quizzviz-backend-production.up.railway.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { quizId } = req.query;
  const userId = req.headers['x-user-id'] || req.body?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  if (!quizId) {
    return res.status(400).json({ error: 'Quiz ID is required' });
  }

  const backendUrl = `${BACKEND_BASE_URL}/user/${encodeURIComponent(userId)}/quizz/${encodeURIComponent(quizId as string)}`;

  try {
    switch (req.method) {
      case 'GET':
        return handleGet();
      case 'PUT':
        return handlePut();
      case 'DELETE':
        return handleDelete();
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err: any) {
    console.error(`API error in /api/quiz/[quizId] (${req.method}):`, err);
    return res.status(500).json({ 
      error: err?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  async function handleGet() {
    const response = await fetch(backendUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to fetch quiz');
      return res.status(response.status).json({ error });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  }

  async function handlePut() {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to update quiz');
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  }

  async function handleDelete() {
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to delete quiz');
      return res.status(response.status).json({ error });
    }

    return res.status(204).end();
  }
}
