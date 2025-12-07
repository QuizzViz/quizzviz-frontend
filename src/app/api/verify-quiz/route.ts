import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const quizUrl = searchParams.get('quizUrl');
  const key = searchParams.get('key');

  if (!quizUrl || !key) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/public/quiz/${encodeURIComponent(quizUrl)}?key=${encodeURIComponent(key)}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify quiz' },
      { status: 500 }
    );
  }
}
