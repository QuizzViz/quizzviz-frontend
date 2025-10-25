import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient, getAuth } from '@clerk/nextjs/server';

// Types
type ApiResponse<T = any> = {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<PublishedQuiz>>
) {
  // Handle only GET and DELETE requests
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
    return;
  }

  try {
    // Authentication check
    const { userId, getToken } = getAuth(req);
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }

    // Get the session token
    const token = await getToken();
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication token not found' 
      });
      return;
    }

    // Extract route parameters
    const { userId: paramUserId, quizId } = req.query as { 
      userId: string; 
      quizId: string; 
    };

    if (!paramUserId || !quizId) {
      res.status(400).json({ 
        success: false,
        message: 'User ID and Quiz ID are required' 
      });
      return;
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      try {
        const deleteResponse = await fetch(
          `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${paramUserId}/quiz/${quizId}`,
          {
            method: 'DELETE',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('Delete API error:', deleteResponse.status, errorText);
          res.status(deleteResponse.status).json({
            success: false,
            message: 'Failed to unpublish quiz',
            error: errorText
          });
          return;
        }

        res.status(204).end();
        return;
      } catch (error) {
        console.error('Error in DELETE handler:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error during unpublish',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
      }
    }

    // Handle GET request (original functionality)
    let user;
    try {
      const clerk = await clerkClient();
      user = await clerk.users.getUser(paramUserId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    const username = (user.username || user.firstName || 'user').toLowerCase().replace(/\s+/g, '');
    
    // Get the origin from the request headers
    const origin = req.headers.origin || req.headers.host 
      ? `${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}`  
      : '';
    
    // Fetch published quiz from external API using the username
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/public/quiz/${encodeURIComponent(`${origin}/${username}/take/quiz/${quizId}`)}`,
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
      res.status(response.status).json({ 
        success: false,
        message: 'Failed to fetch published quiz',
        error: errorText
      });
      return;
    }

    const quizData: PublishedQuiz = await response.json();
    
    res.status(200).json({
      success: true,
      data: quizData
    });
    return;

  } catch (error) {
    console.error('Server error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
}
