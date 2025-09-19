import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from "@clerk/nextjs/server";

const BACKEND_BASE_URL = 'https://quizzviz-quiz-generation.up.railway.app';

// Helper function to handle API errors
const handleApiError = (error: any, res: NextApiResponse) => {
  console.error('API Error:', error);
  return res.status(500).json({ 
    error: error?.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

async function handleGet(res: NextApiResponse, url: string, headers: HeadersInit) {
  try {
    console.log('Fetching quiz with headers:', {
      ...headers,
      'Authorization': 'Bearer ***'
    });
    
    const response = await fetch(url, { 
      headers,
      credentials: 'include'
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('Backend error:', data);
      return res.status(response.status).json({
        error: data.detail || data.message || 'Failed to fetch quiz',
        code: data.code
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error in GET /api/quiz/[quizId]:', error);
    return handleApiError(error, res);
  }
}

async function handlePut(res: NextApiResponse, url: string, headers: HeadersInit, body: any) {
  try {
    console.log('Updating quiz with data:', {
      url,
      body,
      headers: {
        ...headers,
        'Authorization': 'Bearer ***'
      }
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('Backend error:', data);
      return res.status(response.status).json({
        error: data.detail || data.message || 'Failed to update quiz',
        code: data.code
      });
    }

    return res.status(response.status).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error in PUT /api/quiz/[quizId]:', error);
    return handleApiError(error, res);
  }
}

async function handleDelete(res: NextApiResponse, url: string, headers: HeadersInit) {
  try {
    console.log('Deleting quiz:', {
      url,
      headers: {
        ...headers,
        'Authorization': 'Bearer ***'
      }
    });

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return res.status(response.status).json({
        error: errorData.detail || errorData.message || 'Failed to delete quiz',
        code: errorData.code,
        success: false
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/quiz/[quizId]:', error);
    return handleApiError(error, res);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get authentication details from Clerk
    const auth = getAuth(req);
    const { userId } = auth;
    
    // Get user ID from query parameters as fallback
    const queryUserId = req.query.userId as string | undefined;
    const effectiveUserId = userId || queryUserId;
    
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
        details: 'No authentication token found in cookies'
      });
    }

    const { quizId } = req.query as { quizId: string };
    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }

    // Validate quizId format if needed
    if (Array.isArray(quizId)) {
      return res.status(400).json({ error: 'Invalid quiz ID format' });
    }

    // Ensure we're using the correct endpoint (note: 'quizz' with double 'z' in the backend)
    const backendUrl = `${BACKEND_BASE_URL}/user/${encodeURIComponent(effectiveUserId)}/quizz/${encodeURIComponent(quizId)}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    };

    // Log the request for debugging
    console.log(`[${req.method}] ${backendUrl}`, {
      headers: { ...headers, 'Authorization': 'Bearer ***' },
      body: req.body ? JSON.stringify(req.body).substring(0, 200) + '...' : undefined
    });

    switch (req.method) {
      case 'GET':
        return handleGet(res, backendUrl, headers);
      case 'PUT':
        return handlePut(res, backendUrl, headers, req.body);
      case 'DELETE':
        return handleDelete(res, backendUrl, headers);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(`API error in /api/quiz/[quizId] (${req.method}):`, error);
    return handleApiError(error, res);
  }
}
