import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";

const BACKEND_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}`;

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return NextResponse.json(
    { 
      error: error?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    { status: 500 }
  );
};

export async function GET(request: Request) {
  // Create a NextRequest object from the incoming request
  const nextRequest = new NextRequest(request);
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const auth = getAuth(nextRequest);
    const { userId: authUserId } = auth;
    
    // Use authenticated user ID if available, otherwise fall back to query param
    const effectiveUserId = authUserId || userId;
    
    if (!effectiveUserId) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'No user ID found in session or query parameters'
        },
        { status: 401 }
      );
    }

    // Get the session token from cookies
    const cookieHeader = nextRequest.cookies.toString();
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...vals] = c.trim().split('=');
        return [key, vals.join('=')];
      })
    );
    
    const sessionToken = cookies.__session || '';
    
    if (!sessionToken) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'No authentication token provided in cookies'
        },
        { status: 401 }
      );
    }

    // Log the request for debugging
    console.log('Sending request to quiz usage backend:', {
      url: `${BACKEND_BASE_URL}/user/${encodeURIComponent(effectiveUserId)}/quizzes/usage`,
      method: 'GET',
      userId: effectiveUserId,
      hasToken: !!sessionToken
    });

    // Make request to backend
    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${encodeURIComponent(effectiveUserId)}/quizzes/usage`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        next: { revalidate: 0 } // Disable caching
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { 
          error: errorData.detail || errorData.message || 'Failed to fetch quiz usage',
          code: errorData.code
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error in /api/quiz-usage:', error);
    return handleApiError(error);
  }
}

// Export other HTTP methods as needed
export async function POST() {
  return new NextResponse(null, { status: 405 });
}

export async function PUT() {
  return new NextResponse(null, { status: 405 });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
