import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from "@clerk/nextjs/server";

const BACKEND_URL = 'http://34.227.93.117/quizz';

// Helper function to handle API errors
const handleApiError = (error: any, res: NextApiResponse) => {
  console.error('API Error:', error);
  return res.status(500).json({ 
    error: error?.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get authentication details from Clerk
    const auth = getAuth(req);
    const { userId: authUserId } = auth;
    
    // Get user ID from request body as fallback
    const requestBody = req.body || {};
    const { userId: bodyUserId } = requestBody;
    const effectiveUserId = authUserId || bodyUserId;
    
    if (!effectiveUserId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No user ID found in session or request body'
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
        details: 'No authentication token found in cookies'
      });
    }

    // Extract quiz data from request body, excluding userId if present
    const { userId: __, ...quizData } = requestBody;

    // Verify the requested userId matches the authenticated user if both are provided
    if (authUserId && bodyUserId && authUserId !== bodyUserId) {
      console.error('User ID mismatch:', { 
        authUserId, 
        bodyUserId,
        path: req.url 
      });
      return res.status(403).json({ 
        error: 'Unauthorized access',
        details: 'User ID in request does not match authenticated user',
        authUserId,
      });
    }

    console.log('Sending quiz generation request:', {
      url: BACKEND_URL,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: { 
        ...quizData, 
        user_id: effectiveUserId
      }
    });

    const backendResp = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        ...quizData,
        user_id: effectiveUserId
      }),
    });

    const contentType = backendResp.headers.get('content-type') || '';

    if (!backendResp.ok) {
      let errorData;
      try {
        errorData = await backendResp.json();
      } catch (e) {
        errorData = { error: await backendResp.text() };
      }
      
      // Check for non-software topic error
      if (backendResp.status === 400 && errorData.error?.includes('not a software development topic')) {
        return res.status(400).json({
          error: 'Please provide a software development related topic',
          details: errorData.error
        });
      }

      return res.status(backendResp.status).json({
        error: 'Quiz Generation Failed',
        message: errorData?.error || 'Unknown error occurred',
        isTopicError: false
      });
    }

    let responseData;
    try {
      responseData = await backendResp.json();
      
      if (responseData.error) {
        return res.status(400).json({
          error: 'Quiz Generation Failed',
          message: responseData.error,
          isTopicError: false
        });
      }
      
      return res.status(200).json(responseData);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to parse quiz response:', errorMessage);
      return res.status(500).json({
        error: 'Invalid response format from quiz generation service',
        details: errorMessage
      });
    }
    
  } catch (err: any) {
    console.error('API error in /api/quiz:', err);
    return res.status(500).json({ 
      error: err?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
