import type { NextApiRequest, NextApiResponse } from 'next';

// GET /api/quizzes?userId=... -> proxies to backend: /user/{userId}/quizzes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    const backendUrl = `https://quizzviz-backend-production.up.railway.app/user/${encodeURIComponent(
      userId
    )}/quizzes`;

    const upstreamResp = await fetch(backendUrl, { method: 'GET' });

    const contentType = upstreamResp.headers.get('content-type') || '';

    if (!upstreamResp.ok) {
      const text = await upstreamResp.text().catch(() => '');
      return res
        .status(upstreamResp.status)
        .send(text || `Upstream error with status ${upstreamResp.status}`);
    }

    if (contentType.includes('application/json')) {
      const data = await upstreamResp.json();
      return res.status(200).json(data);
    } else {
      const text = await upstreamResp.text();
      return res.status(200).send(text);
    }
  } catch (err: any) {
    console.error('API proxy error /api/quizzes:', err);
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
