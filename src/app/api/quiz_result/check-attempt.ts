import type { NextApiRequest, NextApiResponse } from 'next';
import { AttemptCheckResponse, ErrorResponse } from '@/types/quizResult';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL}`;

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
    const { email, quiz_id } = req.query;
    
    if (!email || !quiz_id) {
      return res.status(400).json({ 
        detail: 'email and quiz_id are required query parameters' 
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/check/attempt/email/${email}/quiz/${quiz_id}`,
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
