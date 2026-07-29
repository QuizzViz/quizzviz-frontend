import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL || '';

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return NextResponse.json(
    {
      error: error?.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    },
    { status: error?.status || 500 }
  );
};

// Updated helper to get companyId from body, query params, headers, or URL path
async function getAuthAndCompanyId(request: NextRequest, body?: any) {
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

  // Try to get companyId from body first
  let companyId = body?.companyId;
  
  // If not in body, try query params
  if (!companyId) {
    const url = new URL(request.url);
    companyId = url.searchParams.get('companyId');
  }
  
  // If not in query params, try headers
  if (!companyId) {
    companyId = request.headers.get('x-company-id');
  }
  
  // If not in headers, try to extract from URL path for quiz service endpoints
  if (!companyId) {
    const urlPath = new URL(request.url).pathname;
    // Match pattern: /api/quiz/[id] where the actual backend call is /user/{companyId}/quizz/{quizId}
    const pathParts = urlPath.split('/');
    console.log('URL path parts for debugging:', pathParts);
    
    // For quiz service calls, we need to extract companyId from the backend URL pattern
    // This handles cases where frontend calls quiz service which expects companyId in URL path
    if (pathParts.includes('quiz') && pathParts.length >= 4) {
      // URL pattern: /api/quiz/[id] -> backend: /user/{companyId}/quizz/{quizId}
      // We need to look at the backend service URL pattern to extract companyId
      console.log('Attempting to extract companyId from quiz service URL pattern');
      
      // Try to get companyId from the request context or other means
      // For now, we'll use a fallback approach for quiz service endpoints
      const quizId = pathParts[pathParts.length - 1];
      console.log('Quiz ID from path:', quizId);
      
      // For quiz service endpoints, we might need to get companyId differently
      // This is a temporary fix - the ideal solution is to ensure companyId is passed properly
      if (quizId) {
        console.log('Quiz service endpoint detected, using fallback companyId extraction');
        // For quiz service, we'll need to implement proper companyId extraction
        // For now, this will be handled by ensuring proper headers are sent
      }
    }
  }

  if (!companyId) {
    return {
      error: NextResponse.json(
        { error: 'companyId is required (in body, query params, or x-company-id header)' },
        { status: 400 }
      )
    };
  }

  console.log('Extracted companyId:', companyId);
  return { userId, companyId, token };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // For GET, try to get companyId from query params or headers
    const auth = await getAuthAndCompanyId(request);
    if ('error' in auth) return auth.error;

    const { companyId, token } = auth;
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    console.log('Fetching quiz:', { companyId, quizId });

    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${companyId}/quizz/${encodeURIComponent(quizId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Quiz not found', quizId }, { status: 404 });
      }

      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}

      const message = (errorData as any)?.detail || (errorData as any)?.message || `Failed to fetch quiz (${response.status})`;
      throw Object.assign(new Error(message), { status: response.status, details: errorData });
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // For DELETE, get companyId from query params or headers
    const auth = await getAuthAndCompanyId(request);
    if ('error' in auth) return auth.error;

    const { userId, companyId, token } = auth;
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // A Member may only delete a quiz they generated themselves, and only
    // while it's still unpublished — once published, deletion is Owner/Admin
    // only, even for the Member who created it. The client already hides the
    // option in this case (rolePermissions.ts), but that's not enough on its
    // own since this endpoint can be called directly, so enforce it here too.
    // If the role or quiz lookup itself fails, fall through to the delete
    // rather than blocking it — this check should only ever narrow access
    // for confirmed Members, never break Owner/Admin deletes on a transient
    // lookup error.
    try {
      const roleUrl = `${process.env.NEXT_PUBLIC_COMPANY_MEMBERS_SERVICE_URL}/member/role?user_id=${encodeURIComponent(userId)}&company_id=${encodeURIComponent(companyId)}`;
      const roleResponse = await fetch(roleUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });

      if (roleResponse.ok) {
        const roleData = await roleResponse.json().catch(() => ({}));

        if (roleData?.role === 'MEMBER') {
          const quizResponse = await fetch(
            `${BACKEND_BASE_URL}/user/${companyId}/quizz/${encodeURIComponent(quizId)}`,
            {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
              cache: 'no-store'
            }
          );

          if (quizResponse.ok) {
            const quiz = await quizResponse.json().catch(() => ({}));
            const isOwner = quiz?.user_id === userId;
            const isPublished = Boolean(quiz?.is_publish);

            if (!isOwner || isPublished) {
              return NextResponse.json(
                { error: 'Members can only delete their own unpublished quizzes' },
                { status: 403 }
              );
            }
          }
        }
      }
    } catch (permissionError) {
      console.error('Error checking delete permission for quiz:', quizId, permissionError);
    }

    console.log('Deleting quiz:', { companyId, quizId });

    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${companyId}/quizz/${encodeURIComponent(quizId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-company-id': companyId  // Add company ID header
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new NextResponse(null, { status: 204 });
      }

      const data = await response.json().catch(() => ({}));
      console.error('Backend delete failed:', data);
      throw new Error(data.detail || data.message || 'Delete failed');
    }

    console.log('Quiz deleted successfully:', quizId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/quiz/[id]:', error);
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // First, parse the request body
    const body = await request.json().catch(() => ({}));
    
    // Pass the parsed body to getAuthAndCompanyId
    const auth = await getAuthAndCompanyId(request, body);
    if ('error' in auth) return auth.error;

    const { companyId, token } = auth;
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    console.log('Patching quiz:', { companyId, quizId });

    // Use the already parsed body for the API call
    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${companyId}/quizz/${encodeURIComponent(quizId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to update quiz' },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Parse the request body first
    const body = await request.json().catch(() => ({}));
    
    // Get auth with body to extract companyId
    const auth = await getAuthAndCompanyId(request, body);
    if ('error' in auth) return auth.error;

    const { companyId, token } = auth;
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    console.log('Unpublishing quiz:', { companyId, quizId });

    // Unpublish from publish service
    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${companyId}/quiz/${quizId}`;
    
    const unpublishResponse = await fetch(publishServiceUrl, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-company-id': companyId
      }
    });

    if (!unpublishResponse.ok) {
      const errorData = await unpublishResponse.json().catch(() => ({}));
      console.error('Failed to unpublish quiz:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to unpublish quiz',
          details: errorData.detail || errorData.message || 'Unknown error'
        },
        { status: unpublishResponse.status }
      );
    }

    // Update backend status to unpublished
    const backendUrl = `${BACKEND_BASE_URL}/user/${companyId}/quizz/${encodeURIComponent(quizId)}`;
    
    const updateResponse = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': companyId
      },
      body: JSON.stringify({
        is_publish: false,
        public_link: null,
        quiz_key: null
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error('Failed to update quiz status:', errorData);
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
    console.error('Error in PUT /api/quiz/[id]:', error);
    return handleApiError(error);
  }
}

// Disallow unsupported methods
export async function POST() {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: 'GET, DELETE, PATCH, PUT' }
  });
}