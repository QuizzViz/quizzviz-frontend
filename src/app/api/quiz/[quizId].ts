import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from "@clerk/nextjs/server";

const BACKEND_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}`;

// Helper function to handle API errors
const handleApiError = (error: any, res: NextApiResponse) => {
  console.error('API Error:', error);
  return res.status(500).json({ 
    error: error?.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Helper function to make API requests
async function makeRequest(
  method: string, 
  url: string, 
  headers: Record<string, string> = {},
  data: any = null
) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  console.log(`Making ${method} request to ${url}`, { options });
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    (error as any).status = response.status;
    console.error('API Request failed:', { 
      url, 
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw error;
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

// Helper to get auth headers from cookies
function getAuthHeaders(cookieHeader: string = ''): {
  'Authorization': string;
  'Content-Type': string;
  'accept'?: string;
} {
  const cookies = Object.fromEntries(
    (cookieHeader || '').split(';').map(c => {
      const [key, ...vals] = c.trim().split('=');
      return [key, vals.join('=')];
    })
  );
  
  const sessionToken = cookies.__session || '';
  return {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json',
    'accept': 'application/json'
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { quizId } = req.query;
    const auth = getAuth(req);
    const { userId: authUserId } = auth;
    
    // Get user ID from headers as fallback
    const userId = req.headers['x-user-id'] || authUserId;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No user ID found in session or headers'
      });
    }

    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }

    // Encode user ID and quiz ID for URL
    const encodedUserId = encodeURIComponent(userId as string);
    const encodedQuizId = encodeURIComponent(quizId as string);
    
    // Construct the base URL with user ID and quiz ID
    const baseUrl = `${BACKEND_BASE_URL}/user/${encodedUserId}/quizz/${encodedQuizId}`;
    
    // Get auth headers with proper accept header
    const headers = getAuthHeaders(req.headers.cookie || '');
    headers['accept'] = 'application/json';

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET': {
        try {
          // Get quiz by ID
          const response = await makeRequest('GET', baseUrl, headers);
          console.log('Raw API response:', JSON.stringify(response, null, 2));
          
          // Parse the quiz string if it exists
          let questions = [];
          try {
            // Try to parse the quiz data if it's a string
            const quizData = typeof response.quiz === 'string' 
              ? JSON.parse(response.quiz) 
              : response.quiz;
              
            // Handle different possible structures
            if (Array.isArray(quizData)) {
              questions = quizData;
            } else if (quizData && typeof quizData === 'object' && quizData.questions) {
              questions = Array.isArray(quizData.questions) ? quizData.questions : [];
            } else if (quizData && typeof quizData === 'object' && Object.keys(quizData).length > 0) {
              // If quizData is an object with question data, convert to array
              questions = Object.entries(quizData).map(([id, data]: [string, any]) => ({
                id: data.id || id,
                type: data.type || 'theory',
                question: data.question || '',
                code_snippet: data.code_snippet || null,
                options: data.options || {},
                correct_answer: data.correct_answer || ''
              }));
            }
          } catch (e) {
            console.error('Error parsing quiz data:', e);
            // Continue with empty questions if parsing fails
          }
          
          // Transform the response to match the expected frontend format
          const quizData = {
            quiz_id: response.quiz_id || quizId,
            role: response.role,
            difficulty: response.difficulty || 'Medium',
            questions: questions,
            quiz_key: response.quiz_key || '',
            quiz_time: response.quiz_time || 1800, // 30 minutes default
            quiz_expiration_time: response.quiz_expiration_time || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            max_attempts: response.max_attempts,
            num_questions: response.num_questions || questions.length || 0
          };
          
          console.log('Formatted quiz data:', JSON.stringify(quizData, null, 2));
          return res.status(200).json(quizData);
        } catch (error: any) {
          if (error.status === 404) {
            return res.status(404).json({
              error: 'Quiz not found',
              details: 'The requested quiz could not be found or you do not have permission to access it.'
            });
          }
          throw error; // Re-throw other errors to be caught by the outer try-catch
        }
      }
      
      case 'PUT': {
        // Update quiz
        if (!req.body) {
          return res.status(400).json({ error: 'Request body is required' });
        }
        
        // Prepare the request body according to the required format
        const updateData = {
          topic: req.body.topic,
          difficulty: req.body.difficulty || 'High School Level',
          num_questions: req.body.num_questions || 0,
          theory_questions_percentage: req.body.theory_questions_percentage || 0,
          code_analysis_questions_percentage: req.body.code_analysis_questions_percentage || 0,
          quiz: req.body.quiz || [],
          is_publish: req.body.is_publish || false
        };
        
        // Make the PUT request with the exact format
        const updatedQuiz = await makeRequest('PUT', baseUrl, headers, updateData);
        return res.status(200).json(updatedQuiz);
      }
      
      case 'DELETE': {
        // Delete quiz
        await makeRequest('DELETE', baseUrl, {
          ...headers,
          'accept': 'application/json'
        });
        return res.status(204).end();
      }
      
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Error in /api/quiz/[quizId]:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error.details 
      })
    });
  }
}
