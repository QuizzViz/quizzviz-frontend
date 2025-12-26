import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// GET - Fetch published quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; company_id: string }> }
) {
  const resolvedParams = await params;
  return handleGetPublishedQuiz(request, resolvedParams);
}

// POST - Publish quiz (kept for compatibility)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; company_id: string }> }
) {
  const resolvedParams = await params;
  return handlePublishRequest(request, resolvedParams, 'POST');
}

// DELETE - Unpublish/delete quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; company_id: string }> }
) {
  const resolvedParams = await params;
  return handlePublishRequest(request, resolvedParams, 'DELETE');
}

// Handle GET request to fetch published quiz
async function handleGetPublishedQuiz(
  request: NextRequest,
  params: { quizId: string; company_id: string }
) {
  try {
    const { quizId, company_id } = params;

    if (!quizId || !company_id) {
      return NextResponse.json(
        { error: 'Quiz ID and Company ID are required' },
        { status: 400 }
      );
    }

    const { userId: authUserId, getToken } = getAuth(request);

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get authentication token - REQUIRED for GET requests too
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    // Construct the URL to fetch the published quiz
    // Using the endpoint format: /publish/quiz/{company_id}/{quiz_id}
    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${company_id}/quiz/${quizId}`;

    console.log('Fetching published quiz from:', publishServiceUrl);

   const headers = new Headers();
headers.append('accept', 'application/json');
headers.append('Authorization', `Bearer ${token}`);
headers.append('Content-Type', 'application/json');
headers.append('x-company-id', company_id);
headers.append('x-user-id', authUserId); 

    const response = await fetch(publishServiceUrl, {
      method: 'GET',
      headers,
      cache: 'no-store' // Prevent caching for this request
    });

    if (!response.ok) {
      let errorDetails;
      try {
        const errorData = await response.json();
        errorDetails = errorData.detail || errorData.message || 'Unknown error';
      } catch (e) {
        errorDetails = await response.text().catch(() => 'Unknown error');
      }
      
      console.error('Fetch published quiz error:', {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
        url: publishServiceUrl
      });

      // Return null data for 404 instead of error
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Published quiz not found',
            data: null 
          },
          { status: 200 } // Return 200 with null data
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch published quiz',
          details: errorDetails 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('Successfully fetched published quiz');

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Published quiz retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get published quiz failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Handle POST and DELETE requests
async function handlePublishRequest(
  request: NextRequest,
  params: { quizId: string; company_id: string },
  method: 'POST' | 'DELETE'
) {
  try {
    const { quizId, company_id } = params;

    if (!quizId || !company_id) {
      return NextResponse.json(
        { error: 'Quiz ID and Company ID are required' },
        { status: 400 }
      );
    }

    const { userId: authUserId, getToken } = getAuth(request);

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the authenticated user matches the userId in the URL
    // Removed this check as it's not relevant with company_id

    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    // Construct the URL to publish/unpublish quiz
    // Using the endpoint format: /publish/quiz/{company_id}/{quiz_id}
    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${company_id}/quiz/${quizId}`;

    console.log(`${method} request to:`, publishServiceUrl);

    // Prepare the request body with company_id and other necessary fields
    let requestBody = {};
    if (method === 'POST') {
      // Get the request body from the original request
      const requestData = await request.json().catch(() => ({}));
      requestBody = {
        ...requestData,
        company_id
      };
    }

    const headers = new Headers();
    headers.append('accept', 'application/json');
    headers.append('Authorization', `Bearer ${token}`);
    headers.append('Content-Type', 'application/json');
    headers.append('x-company-id', company_id);

    const response = await fetch(publishServiceUrl, {
      method: method,
      headers,
      body: method === 'POST' ? JSON.stringify(requestBody) : undefined,
      cache: 'no-store' // Prevent caching for this request
    });

    if (!response.ok) {
      let errorDetails;
      try {
        const errorData = await response.json();
        errorDetails = errorData.detail || errorData.message || 'Unknown error';
      } catch (e) {
        errorDetails = await response.text().catch(() => 'Unknown error');
      }
      
      console.error('Publish service error:', {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
        url: publishServiceUrl,
        method: method
      });

      return NextResponse.json(
        { 
          error: 'Failed to process publish request',
          details: errorDetails 
        },
        { status: response.status }
      );
    }

    const responseData = method === 'DELETE' 
      ? {} 
      : await response.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: true,
        message: method === 'DELETE' ? 'Quiz unpublished successfully' : 'Quiz published successfully',
        data: responseData
      },
      { status: method === 'DELETE' ? 200 : 200 }
    );

  } catch (error: any) {
    console.error('Publish request failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}