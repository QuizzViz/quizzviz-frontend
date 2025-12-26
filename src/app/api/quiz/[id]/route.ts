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

// In src/app/api/quiz/[id]/route.ts

// Update the getAuthAndCompanyId function to accept the parsed body
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

  const companyId = body?.companyId;

  if (!companyId) {
    return {
      error: NextResponse.json(
        { error: 'companyId is required in request body' },
        { status: 400 }
      )
    };
  }

  return { userId, companyId, token };
}

// Then update the PATCH handler
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
        body: JSON.stringify(body)  // Use the already parsed body
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthAndCompanyId(request);
  if ('error' in auth) return auth.error;

  const { companyId, token } = auth;

  try {
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
  const auth = await getAuthAndCompanyId(request);
  if ('error' in auth) return auth.error;

  const { companyId, token } = auth;

  try {
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    console.log('Deleting quiz:', { companyId, quizId });

    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${companyId}/quizz/${encodeURIComponent(quizId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new NextResponse(null, { status: 204 });
      }

      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Delete failed');
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// export async function PATCH(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const auth = await getAuthAndCompanyId(request);
//   if ('error' in auth) return auth.error;

//   const { companyId, token } = auth;

//   try {
//     const { id: quizId } = await context.params;
//     const payload = await request.json();

//     if (!quizId) {
//       return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
//     }

//     console.log('Patching quiz:', { companyId, quizId });

//     const response = await fetch(
//       `${BACKEND_BASE_URL}/user/${companyId}/quizz/${encodeURIComponent(quizId)}`,
//       {
//         method: 'PUT',  // most backends use PUT for updates
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(payload)
//       }
//     );

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return NextResponse.json(
//         { error: errorData.message || 'Failed to update quiz' },
//         { status: response.status }
//       );
//     }

//     return NextResponse.json(await response.json());
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthAndCompanyId(request);
  if ('error' in auth) return auth.error;

  const { companyId, token } = auth;

  try {
    const { id: quizId } = await context.params;

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // Unpublish from publish service
    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${companyId}/quiz/${quizId}`;
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