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
async function getCompanyId(userId: string, token: string, request: Request) {
  try {
    // Get the origin from the request URL
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const url = new URL(`/api/company/check?owner_id=${encodeURIComponent(userId)}`, baseUrl).toString();
    
    console.log('Fetching company info from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch company info:', response.status, errorText);
      throw new Error('Failed to fetch company information');
    }

    const data = await response.json();
    console.log('Company check response:', data);
    
    // Check if company exists and has data
    if (!data.exists || !Array.isArray(data.companies) || data.companies.length === 0) {
      console.error('No company found for user:', userId);
      throw new Error('No company found for this user');
    }

    // Get the first company from the array
    const company = data.companies[0];
    console.log('Company data:', company);
    
    // Extract company_id from the company object
    const companyId = company.company_id;
    
    if (!companyId) {
      console.error('Company ID not found in company data:', company);
      throw new Error('Company ID not found in response');
    }

    console.log('Found company ID:', companyId);
    return companyId;
  } catch (error) {
    console.error('Error in getCompanyId:', error);
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
    const companyId = await getCompanyId(userId, sessionToken, request);
    
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
