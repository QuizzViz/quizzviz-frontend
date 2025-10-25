import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from "@clerk/nextjs/server";

const BACKEND_BASE_URL = (process.env.QUIZZ_GENERATION_SERVICE_URLs as string);

// Helper function to handle API errors
const handleApiError = (error: any, res: NextApiResponse) => {
  console.error('API Error:', error);
  return res.status(500).json({ 
    error: error?.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

async function handleGet(userId: string, token: string) {
  const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
  const url = `${BACKEND_BASE_URL}/user/${encodeURIComponent(userIdStr)}/quizzes`;
  
  // Log the request for debugging
  console.log('Sending request to backend:', {
    url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  try {
    const response = await fetch(url, { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return { 
        status: response.status, 
        data: { 
          error: errorData.detail || errorData.message || 'Failed to fetch quizzes',
          code: errorData.code
        } 
      };
    }

    const data = await response.json();
    return { status: response.status, data };
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    return { 
      status: 500, 
      data: { 
        error: error?.message || 'Failed to fetch quizzes',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } 
    };
  }
}

async function handlePost(userId: string, token: string, body: any) {
  if (!body) {
    return { status: 400, data: { error: 'Request body is required' }};
  }

  try {
    const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
    
    // Get the exact percentages from the request
    let codePercentage = 50;
    let theoryPercentage = 50;
    
    // If code percentage is provided, use it and calculate theory percentage
    if (body.code_analysis_questions_percentage !== undefined) {
      codePercentage = Math.max(0, Math.min(100, Number(body.code_analysis_questions_percentage)));
      theoryPercentage = 100 - codePercentage;
    }
    // If theory percentage is provided, use it and calculate code percentage
    else if (body.theory_questions_percentage !== undefined) {
      theoryPercentage = Math.max(0, Math.min(100, Number(body.theory_questions_percentage)));
      codePercentage = 100 - theoryPercentage;
    }
    
    console.log('Using percentages - Code:', codePercentage, 'Theory:', theoryPercentage);
    
    // Prepare the request payload according to backend's QuizRequest model
    const payload = {
      topic: body.topic,
      difficulty: body.difficulty || 'Bachelors Level',
      num_questions: body.num_questions || 25,
      theory_questions_percentage: theoryPercentage,
      code_analysis_questions_percentage: codePercentage,
      user_id: userIdStr,
      isPublished: false 
    };
    
    // Log the outgoing request for debugging
    console.log('Sending quiz generation request:', {
      url: `${BACKEND_BASE_URL}/quizz`,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: payload
    });

    const response = await fetch(
      `${BACKEND_BASE_URL}/quizz`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return { 
        status: response.status, 
        data: { 
          error: errorData.detail || errorData.message || 'Failed to create quiz',
          code: errorData.code
        } 
      };
    }

    const data = await response.json();
    return { status: response.status, data };
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return { 
      status: 500, 
      data: { 
        error: error?.message || 'Failed to create quiz',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } 
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get authentication details from Clerk
    const auth = getAuth(req);
    const { userId: authUserId } = auth;
    
    // Get user ID from query parameters as fallback
    const queryUserId = req.query.userId as string | undefined;
    const effectiveUserId = authUserId || queryUserId;
    
    if (!effectiveUserId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No user ID found in session or query parameters'
      });
    }

    // Parse cookies from the request
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...vals] = c.trim().split('=');
        return [key, vals.join('=')];
      })
    );
    
    // Get the session token from Clerk cookies
    const sessionToken = cookies.__session || '';
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No authentication token provided in headers or cookies'
      });
    }

    // Log the incoming request for debugging
    console.log(`[${req.method}] /api/quizzes`, {
      authUserId,
      queryUserId,
      usingUserId: effectiveUserId,
      method: req.method,
      hasBody: !!req.body,
      hasToken: !!sessionToken
    });

    // Route the request based on the HTTP method
    if (req.method === 'GET') {
      const result = await handleGet(effectiveUserId, sessionToken);
      return res.status(result.status).json(result.data);
    } else if (req.method === 'POST') {
      const result = await handlePost(effectiveUserId, sessionToken, req.body);
      return res.status(result.status).json(result.data);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error in /api/quizzes:', error);
    return handleApiError(error, res);
  }
}
