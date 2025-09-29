import type { NextApiRequest, NextApiResponse } from 'next';
import { AttemptCheckResponse, ErrorResponse } from '@/types/quizResult';

const API_BASE_URL = 'https://quizzviz-quiz-result-production.up.railway.app';

type ResponseData = AttemptCheckResponse | ErrorResponse;

// GET /api/quiz_result/check-attempt?user_id=string&email=string&quiz_id=string
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
  }

  try {
    const { user_id, email, quiz_id } = req.query;
    
    if (!user_id || !email || !quiz_id) {
      return res.status(400).json({ 
        detail: 'user_id, email, and quiz_id are required query parameters' 
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/check/attempt/user/${user_id}/email/${email}/quiz/${quiz_id}`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      return res.status(response.status).json(error);
    }

    const data: AttemptCheckResponse = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error checking user attempt:', error);
    return res.status(500).json({ 
      detail: error instanceof Error ? error.message : 'Failed to check user attempt' 
    });
  }
}
