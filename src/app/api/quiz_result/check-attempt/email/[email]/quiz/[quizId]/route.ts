import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL;

type ResponseData = {
  attempts: number;
  max_attempts: number;
} | {
  detail: string;
};

interface Context {
  params: Promise<{
    email: string;
    quizId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    // Await the params promise
    const { email: encodedEmail, quizId } = await context.params;
    const email = decodeURIComponent(encodedEmail);

    if (!email || !quizId) {
      return NextResponse.json(
        { detail: 'Email and quiz ID are required' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'accept': 'application/json',
    };

    // Add auth token if present
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const response = await fetch(
      `${API_BASE_URL}/check/attempt/email/${encodeURIComponent(email)}/quiz/${encodeURIComponent(quizId)}`,
      {
        headers,
        cache: 'no-store' // Ensure we don't get cached responses
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking user attempt:', error);
    return NextResponse.json(
      { 
        detail: error instanceof Error ? error.message : 'Failed to check user attempt' 
      },
      { status: 500 }
    );
  }
}