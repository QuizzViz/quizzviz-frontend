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

// Helper function to get company ID for a user
async function getCompanyId(userId: string, token: string) {
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

export async function GET(request: Request) {
  // Create a NextRequest object from the incoming request
  const nextRequest = new NextRequest(request);
  try {
    const auth = getAuth(nextRequest);
    const { userId } = auth;
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'No user ID found in session'
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

    // Get company ID for the user
    const companyId = await getCompanyId(userId, sessionToken);
    
    // Log the request for debugging
    console.log('Sending request to quiz usage backend:', {
      url: `${BACKEND_BASE_URL}/user/${companyId}/quizzes/usage`,
      method: 'GET',
      companyId,
      hasToken: !!sessionToken
    });

    // Make request to backend
    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${companyId}/quizzes/usage`,
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
