import type { NextApiRequest, NextApiResponse } from 'next';
import { QuizResult, ErrorResponse } from '@/types/quizResult';

const API_BASE_URL = 'https://quizzviz-quiz-result-production.up.railway.app';

type ResponseData = QuizResult | ErrorResponse;

// POST /api/quiz_result
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
  }

  try {
    const { quiz_id, owner_id, username, user_email, user_answers, result, attempt } = req.body;

    // Validate required fields
    if (!quiz_id || !owner_id || !username || !user_email || !user_answers || !result || attempt === undefined) {
      return res.status(400).json({ 
        detail: 'Missing required fields: quiz_id, owner_id, username, user_email, user_answers, result, and attempt are required' 
      });
    }

    const response = await fetch(`${API_BASE_URL}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        quiz_id,
        owner_id,
        username,
        user_email,
        user_answers,
        result,
        attempt: parseInt(attempt, 10)
      }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      return res.status(response.status).json(error);
    }

    const data: QuizResult = await response.json();
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating quiz result:', error);
    return res.status(500).json({ 
      detail: error instanceof Error ? error.message : 'Failed to create quiz result' 
    });
  }
}
