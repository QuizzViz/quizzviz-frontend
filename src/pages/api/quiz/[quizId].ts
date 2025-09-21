import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to handle API errors
const handleApiError = (error: any, res: NextApiResponse) => {
  console.error('API Error:', error);
  return res.status(500).json({ 
    error: error?.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Handle GET request to fetch quiz data
async function handleGet(res: NextApiResponse, url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch quiz data');
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in GET /api/quiz/[quizId]:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quizId } = req.query;
    const { url } = req.query;

    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }

    // If no URL is provided, use the quizId as the identifier
    const quizIdentifier = url || quizId;
    
    // Construct the external API URL
    const externalUrl = `https://quizzviz-publish-quiz.up.railway.app/publish/public/quiz/${encodeURIComponent(quizIdentifier as string)}`;
    
    // Forward the request to the external API
    return handleGet(res, externalUrl);
  } catch (error) {
    console.error('Error in /api/quiz/[quizId]:', error);
    return handleApiError(error, res);
  }
}
