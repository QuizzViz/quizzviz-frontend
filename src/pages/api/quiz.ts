import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const backendUrl = 'https://quizzviz-backend-production.up.railway.app/quizz';

    const backendResp = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const contentType = backendResp.headers.get('content-type') || '';

    if (!backendResp.ok) {
      const text = await backendResp.text().catch(() => '');
      // Pass through status and any details for easier debugging
      return res
        .status(backendResp.status)
        .send(text || `Upstream error with status ${backendResp.status}`);
    }

    if (contentType.includes('application/json')) {
      const data = await backendResp.json();
      return res.status(200).json(data);
    } else {
      const text = await backendResp.text();
      // Fallback if backend returns non-JSON
      return res.status(200).send(text);
    }
  } catch (err: any) {
    console.error('API proxy error /api/quiz:', err);
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
