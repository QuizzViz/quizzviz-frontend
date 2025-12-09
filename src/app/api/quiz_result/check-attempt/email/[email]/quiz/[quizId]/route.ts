import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL || 'https://quizzviz-quiz-result-service-slwv.onrender.com';

type ResponseData = {
  attempts: number;
  max_attempts: number;
} | {
  detail: string;
};

interface Context {
  params: {
    email: string;
    quizId: string;
  };
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const { email: encodedEmail, quizId } = context.params;
    const email = decodeURIComponent(encodedEmail);

    if (!email || !quizId) {
      return NextResponse.json(
        { detail: 'Email and quiz ID are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/check/attempt/email/${encodeURIComponent(email)}/quiz/${encodeURIComponent(quizId)}`,
      {
        headers: {
          'accept': 'application/json',
        },
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
