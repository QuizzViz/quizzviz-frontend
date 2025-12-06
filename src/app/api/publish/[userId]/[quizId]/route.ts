import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

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
  console.log('API hit with:', { username, quizId, method: request.method });

  try {
    if (!username || !quizId) {
      return NextResponse.json({ status: 400 }, { status: 400 });
    }

    const { userId, getToken } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: `Unauthorized - Not authenticated for ${request.method}`,
          status: 401,
        },
        { status: 401 }
      );
    }

    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${username}/quiz/${quizId}`;

    console.log('Calling backend:', publishServiceUrl);

    const response = await fetch(publishServiceUrl, {
      method: request.method,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: request.method === 'POST' ? '{}' : undefined,
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown');
      return NextResponse.json(
        {
          error: `Publish service failed for ${request.method}`,
          details: error,
        },
        { status: response.status }
      );
    }

    return new NextResponse(null, {
      status: request.method === 'DELETE' ? 204 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}
