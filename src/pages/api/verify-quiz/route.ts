import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { quizUrl, key } = req.query;

  if (!quizUrl || !key) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/public/quiz/${encodeURIComponent(quizUrl as string)}?key=${encodeURIComponent(key as string)}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Failed to verify quiz' });
  }
}
