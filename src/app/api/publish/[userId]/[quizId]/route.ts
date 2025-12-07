import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: {quizId: string } }
) {
  return handlePublishRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: {quizId: string } }
) {
  return handlePublishRequest(request, params);
}

async function handlePublishRequest(
  request: NextRequest,
  params: { quizId: string }
) {
  try {
    const { quizId } = params;

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    const { userId: authUserId, getToken } = getAuth(request);

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized', status: 401 },
        { status: 401 }
      );
    }

    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    // Use the authenticated user's ID from Clerk
    const effectiveUserId = authUserId;
    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${effectiveUserId}/quiz/${quizId}`;

    // Include user ID in the request body for POST requests
    let requestBody = {};
    if (request.method === 'POST') {
      requestBody = { user_id: authUserId };
    }

    const response = await fetch(publishServiceUrl, {
      method: request.method,
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: request.method === 'POST' ? JSON.stringify(requestBody) : undefined
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
        method: request.method
      });

      return NextResponse.json(
        { 
          error: 'Failed to process publish request',
          details: errorDetails 
        },
        { status: response.status }
      );
    }

    return new NextResponse(null, {
      status: request.method === 'DELETE' ? 204 : 200
    });
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
