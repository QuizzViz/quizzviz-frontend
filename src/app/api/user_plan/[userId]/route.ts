import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";

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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params first (Next.js 15+ requirement)
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get auth from request
    const { getToken } = getAuth(request);
    
    // Get the token with a custom template if your backend expects it
    // Option 1: Use default Clerk token
    const token = await getToken();
    
    // Option 2: If your backend needs a specific JWT template, use:
    // const token = await getToken({ template: "your-template-name" });
    
    if (!token) {
      console.error('No session token available');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const url = `${process.env.NEXT_PUBLIC_USER_PLAN_SERVICE_URL}/plan/${encodeURIComponent(userId)}`;
    
    console.log('Making request to:', url);
    console.log('Token preview:', token.substring(0, 20) + '...');
    
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