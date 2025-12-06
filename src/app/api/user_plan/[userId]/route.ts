import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_BASE_URL = `${process.env.NEXT_PUBLIC_USER_PLAN_SERVICE_URL}`;

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return NextResponse.json(
    { 
      error: error?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    { status: error.status || 500 }
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { getToken } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the token with the correct template for the backend service
    const token = await getToken();
    
    if (!token) {
      console.error('No session token available');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const url = `${process.env.NEXT_PUBLIC_USER_PLAN_SERVICE_URL}/plan/${encodeURIComponent(userId)}`;
    
    console.log('Making request to:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.text();
        errorData = errorData ? JSON.parse(errorData) : {};
      } catch (e) {
        console.error('Failed to parse error response:', e);
        errorData = {};
      }
      
      console.error('Backend error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      throw new Error(
        errorData.detail || 
        errorData.message || 
        `Failed to fetch user plan: ${response.status} ${response.statusText}`
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/user_plan/[userId]:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: error.status || 500 }
    );
  }
}
