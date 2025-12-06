import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;
  const { getToken } = getAuth(req);
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const authToken = await getToken();
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_USER_PLAN_SERVICE_URL}/plan/${userId}`,
      {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user plan');
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return res.status(500).json({ error: 'Failed to fetch user plan' });
  }
}
