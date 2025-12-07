import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL || '';

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

// Helper function to authenticate and get user info
const authenticateRequest = async (request: NextRequest) => {
  const { userId, getToken } = getAuth(request);
  const token = await getToken() || request.cookies.get('__session')?.value;
  
  if (!userId || !token) {
    return { 
      error: NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    };
  }
  
  return { userId, token };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { userId } = auth;
  try {
    const { id: quizId} = await context.params; 
// ✅ await it

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    const token = request.cookies.get('__session')?.value || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    console.log('Fetching quiz:', { quizId });

    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${userId}/quizz/${encodeURIComponent(quizId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Quiz not found: ${quizId}`);
        return NextResponse.json(
          { error: 'Quiz not found', quizId },
          { status: 404 }
        );
      }

      interface ErrorResponse {
        detail?: string;
        message?: string;
        [key: string]: any;
      }
      
      let errorData: ErrorResponse = {};
      try {
        const responseData = await response.json();
        errorData = typeof responseData === 'object' ? responseData : {};
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      const errorMessage = 
        errorData.detail || 
        errorData.message || 
        `Failed to fetch quiz (${response.status})`;
        
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).details = errorData;
      throw error;
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    console.error('Error in GET /api/quiz/[id]:', error);
    return handleApiError(error);
  }
}


// DELETE handler for deleting a quiz
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { userId, token } = auth;

  try {
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting quiz:', { quizId });

    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${userId}/quizz/${encodeURIComponent(quizId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404)
        return new NextResponse(null, { status: 204 });

      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Delete failed');
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return handleApiError(error);
  }
}


// Add other methods as needed
export async function POST() {
  return new NextResponse(null, { 
    status: 405,
    headers: { 'Allow': 'GET, DELETE' }
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { userId, token } = auth;

  try {
    const { id: quizId } = await context.params;
    const payload = await request.json();

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${userId}/quizz/${encodeURIComponent(quizId)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || 'Failed to update quiz' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;
  const { userId, token } = auth;
  
  try {
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    // Token is already validated in authenticateRequest

    // First, unpublish the quiz from the publish service
    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${userId}/quiz/${quizId}`;
    const unpublishResponse = await fetch(publishServiceUrl, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!unpublishResponse.ok) {
      const errorData = await unpublishResponse.json().catch(() => ({}));
      console.error('Failed to unpublish quiz:', {
        status: unpublishResponse.status,
        statusText: unpublishResponse.statusText,
        error: errorData
      });

      return NextResponse.json(
        { 
          error: 'Failed to unpublish quiz',
          details: errorData.detail || errorData.message || 'Unknown error'
        },
        { status: unpublishResponse.status }
      );
    }

    // Then update the quiz to mark it as unpublished
    const backendUrl = `${process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL}/user/${encodeURIComponent(userId)}/quizz/${encodeURIComponent(quizId)}`;
    const updateResponse = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify({
        is_publish: false,
        public_link: null,
        quiz_key: null
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error('Failed to update quiz status:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        error: errorData
      });

      return NextResponse.json(
        { 
          error: 'Failed to update quiz status',
          details: errorData.detail || errorData.message || 'Unknown error'
        },
        { status: updateResponse.status }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Quiz unpublished successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in PATCH /api/quiz/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
