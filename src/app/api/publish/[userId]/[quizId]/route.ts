import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

interface RouteParams {
  params: {
    userId: string;
    quizId: string;
  };
}

export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  return handlePublishRequest(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  return handlePublishRequest(request, context.params);
}

async function handlePublishRequest(
  request: NextRequest,
  params: { userId: string; quizId: string }
) {
  const { userId: username, quizId } = params;

  try {
    if (!username || !quizId) {
      return NextResponse.json({ status: 400 }, { status: 400 });
    }

    const { userId, getToken } = getAuth(request);

    if (!userId) {
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

    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${username}/quiz/${quizId}`;

    const response = await fetch(publishServiceUrl, {
      method: request.method,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: request.method === 'POST' ? '{}' : undefined
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown');
      return NextResponse.json(
        { error: 'Service failed', details: errorText },
        { status: response.status }
      );
    }

    return new NextResponse(null, {
      status: request.method === 'DELETE' ? 204 : 200
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal error', details: error.message },
      { status: 500 }
    );
  }
}
