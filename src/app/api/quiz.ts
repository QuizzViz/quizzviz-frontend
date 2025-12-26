import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from "@clerk/nextjs/server";

// Helper function to get company ID for a user
async function getCompanyId(userId: string, token: string): Promise<string> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/company/check?owner_id=${encodeURIComponent(userId)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch company information');
    }

    const data = await response.json();
    if (!data.companies || data.companies.length === 0) {
      throw new Error('No company found for this user');
    }

    return data.companies[0].id;
  } catch (error) {
    console.error('Error fetching company ID:', error);
    throw new Error('Failed to get company information');
  }
}

// Helper function to get company info
async function getCompanyInfo(userId: string, token: string): Promise<{id: string; name: string; owner_email: string} | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/company/check?owner_id=${encodeURIComponent(userId)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch company information');
    }

    const data = await response.json();
    if (!data.companies || data.companies.length === 0) {
      return null;
    }

    return {
      id: data.companies[0].id,
      name: data.companies[0].name,
      owner_email: data.companies[0].owner_email
    };
  } catch (error) {
    console.error('Error fetching company info:', error);
    return null;
  }
}

const BACKEND_URL = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/quizz`;

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
    
    if (!authUserId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No user ID found in session'
      });
    }
    
    // Get the session token from cookies
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...vals] = c.trim().split('=');
        return [key, vals.join('=')];
      })
    );
    
    const sessionToken = cookies.__session || '';
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'No authentication token found in cookies'
      });
    }
    
    // Get company ID for the user
    const companyId = await getCompanyId(authUserId, sessionToken);

    // Define the expected request body type
    interface QuizRequest {
      userId?: string;
      topic: string;
      difficulty: string;
      questionCount: number;
      questionType: string;
      [key: string]: any; // Allow additional properties
    }

    // Parse request body
    let requestBody: Partial<QuizRequest> = {};
    try {
      if (typeof req.body === 'string') {
        requestBody = JSON.parse(req.body);
      } else if (typeof req.body === 'object') {
        requestBody = req.body as QuizRequest;
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: 'Failed to parse request body as JSON'
      });
    }

    // Extract quiz data from request body, excluding userId if present
    const { userId: __, ...quizData } = requestBody;

    // Get company information
    const companyInfo = await getCompanyInfo(authUserId, sessionToken);
    
    if (!companyInfo) {
      return res.status(403).json({
        error: 'Company not found',
        details: 'Please create or join a company first'
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
        company_id: companyId
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
        company_id: companyId
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
