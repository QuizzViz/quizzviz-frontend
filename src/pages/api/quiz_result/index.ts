import type { NextApiRequest, NextApiResponse } from 'next';
import { QuizResult, ErrorResponse } from '@/types/quizResult';

const API_BASE_URL = 'https://quizzviz-quiz-result-production.up.railway.app';

type ResponseData = QuizResult[] | ErrorResponse;

// Handler for GET /api/quiz_result?owner_id=:owner_id&quiz_id=:quiz_id
async function handleGetResultsByOwnerAndQuiz(
  ownerId: string,
  quizId: string,
  skip: string | string[],
  limit: string | string[],
  res: NextApiResponse<ResponseData>
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/result/owner/${ownerId}/quiz/${quizId}?skip=${skip}&limit=${limit}`,
      { 
        method: 'GET',
        headers: { 
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      return res.status(response.status).json(error);
    }

    const data: QuizResult[] = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching results by owner and quiz:', error);
    return res.status(500).json({
      detail: error instanceof Error ? error.message : 'Failed to fetch results by owner and quiz'
    });
  }
}

// Handler for GET /api/quiz_result?owner_id=:owner_id
async function handleGetResultsByOwner(
  ownerId: string,
  skip: string | string[],
  limit: string | string[],
  res: NextApiResponse<ResponseData>
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/result/owner/${ownerId}?skip=${skip}&limit=${limit}`,
      { 
        method: 'GET',
        headers: { 
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      return res.status(response.status).json(error);
    }

    const data: QuizResult[] = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching results by owner:', error);
    return res.status(500).json({
      detail: error instanceof Error ? error.message : 'Failed to fetch results by owner'
    });
  }
}



// Handler for POST /api/quiz_result
async function handleCreateResult(
  req: NextApiRequest,
  res: NextApiResponse<QuizResult | ErrorResponse>
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/result`,
      { 
        method: 'POST',
        headers: { 
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      }
    );

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

// Main handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | QuizResult | ErrorResponse>
) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGetRequest(req, res);
    case 'POST':
      return handleCreateResult(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ 
        detail: `Method ${req.method} not allowed` 
      });
  }
}

// Handler for GET requests
async function handleGetRequest(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

  const { owner_id, quiz_id, skip = '0', limit = '100' } = req.query;

  // Validate parameters
  if (!owner_id) {
    return res.status(400).json({
      detail: 'owner_id parameter is required'
    });
  }

  // Route to the appropriate handler based on the query parameters
  try {
    if (owner_id && quiz_id) {
      return await handleGetResultsByOwnerAndQuiz(
        owner_id as string,
        quiz_id as string,
        skip,
        limit,
        res
      );
    }
    
    if (owner_id) {
      return await handleGetResultsByOwner(
        owner_id as string, 
        skip, 
        limit, 
        res
      );
    }
    
}catch (error) {
    console.error('Error in quiz result API:', error);
    return res.status(500).json({
      detail: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
