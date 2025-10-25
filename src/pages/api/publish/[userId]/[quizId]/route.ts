import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';


// Handle both POST and DELETE methods
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; quizId: string } }
) {
  return handlePublishRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; quizId: string } }
) {
  return handlePublishRequest(request, params);
}

async function handlePublishRequest(
  request: NextRequest,
  params: { userId: string; quizId: string }
) {
  const { userId: username, quizId } = params;
  console.log('Publish delete API called with params:', { username, quizId });
  
  try {
    
    if (!username || !quizId) {
      console.error('Missing username or quizId');
      return NextResponse.json(
        { status: 400 }
      );
    }
    
    // Get the authenticated user's ID and token
    const { userId, getToken } = getAuth(request);
    
    if (!userId) {
      console.error('No authenticated user ID found');
      return NextResponse.json(
        { 
          error: `Unauthorized - Not authenticated for ${request.method} request`,
          status: 401 
        },
        { status: 401 }
      );
    }

    // Get the session token
    const token = await getToken();
    
    if (!token) {
      console.error('No session token found');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    // Using the exact endpoint from the curl command
    const publishServiceUrl = `https://quizzviz-publish-quiz.up.railway.app/publish/user/${username}/quiz/${quizId}`;
    console.log('Making request to:', publishServiceUrl, 'with method:', request.method);

    try {
      console.log(`Sending ${request.method} request to:`, publishServiceUrl, 'with token:', token ? 'Token exists' : 'No token');
      
      console.log('Sending request to backend service:', publishServiceUrl, 'with method:', request.method);
      const response = await fetch(publishServiceUrl, {
        method: request.method, // Use the same method as the incoming request
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: request.method === 'POST' ? JSON.stringify({}) : undefined // Only include body for POST
      });
      
      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        console.error('Publish service error:', error);
        return NextResponse.json(
          { 
            error: `Failed to process ${request.method} request to publish service`,
            details: error,
            method: request.method
          },
          { status: response.status }
        );
      }

      console.log(`Successfully processed ${request.method} request to publish service`);
      // Return appropriate status based on the method
      return new NextResponse(null, { 
        status: request.method === 'DELETE' ? 204 : 200 
      });
      
    } catch (error) {
      console.error('Error calling publish service:', error);
      return NextResponse.json(
        { 
          error: `Failed to process ${request.method} request to publish service`,
          details: error instanceof Error ? error.message : 'Unknown error',
          method: request.method
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in publish delete API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      },
      { status: 500 }
    );
  }
}
