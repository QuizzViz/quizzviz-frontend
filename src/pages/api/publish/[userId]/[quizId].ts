import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';

// Types
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type PublishedQuiz = {
  quiz_key: string;
  quiz_id: string;
  user_id: string;
  quiz_public_link: string;
  max_attempts: number;
  quiz_time: number;
  quiz_expiration_time: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz: any[];

};

// Main handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<PublishedQuiz>>
) {
  // Handle only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Authentication check
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    // Extract route parameters
    const { userId: paramUserId, quizId } = req.query as { 
      userId: string; 
      quizId: string; 
    };

    if (!paramUserId || !quizId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and Quiz ID are required' 
      });
    }

    // Get auth token
    const token = await getAuth(req).getToken();
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Fetch published quiz from external API
    const response = await fetch(
      `https://quizzviz-publish-quiz.up.railway.app/publish/user/${paramUserId}/quiz/${quizId}`, 
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', response.status, errorText);
      return res.status(response.status).json({ 
        success: false,
        message: 'Failed to fetch published quiz',
        error: errorText
      });
    }

    const quizData: PublishedQuiz = await response.json();
    
    return res.status(200).json({
      success: true,
      data: quizData
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
