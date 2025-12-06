import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  const { getToken } = getAuth(req);
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const { plan_name } = req.body;
  
  if (!plan_name) {
    return res.status(400).json({ error: 'Plan name is required' });
  }

  try {
    const authToken = await getToken();
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_USER_PLAN_SERVICE_URL}/plan/user_${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ plan_name }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update user plan: ${error}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating user plan:', error);
    return res.status(500).json({ 
      error: 'Failed to update user plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
