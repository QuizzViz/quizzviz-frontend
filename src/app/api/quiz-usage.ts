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

async function handleGet(userId: string, token: string) {
  const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
  const url = `${BACKEND_BASE_URL}/user/${encodeURIComponent(userIdStr)}/quizzes/usage`;
  
  // Log the request for debugging
  console.log('Sending request to quiz usage backend:', {
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
          error: errorData.detail || errorData.message || 'Failed to fetch quiz usage',
          code: errorData.code
        } 
      };
    }

    const data = await response.json();
    return { status: response.status, data };
  } catch (error: any) {
    console.error('Error fetching quiz usage:', error);
    return { 
      status: 500, 
      data: { 
        error: error?.message || 'Failed to fetch quiz usage',
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
    console.log(`[${req.method}] /api/quiz-usage`, {
      authUserId,
      queryUserId,
      usingUserId: effectiveUserId,
      method: req.method,
      hasToken: !!sessionToken
    });

    // Route the request based on the HTTP method
    if (req.method === 'GET') {
      const result = await handleGet(effectiveUserId, sessionToken);
      return res.status(result.status).json(result.data);
    } else {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error in /api/quiz-usage:', error);
    return handleApiError(error, res);
  }
}
