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

    // Get companyId from query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!email || !quizId || !companyId) {
      return NextResponse.json(
        { detail: 'Email, quiz ID, and company ID are required' },
        { status: 400 }
      );
    }

    // No authentication required for candidate check-attempt endpoint
    const headers: Record<string, string> = {
      'accept': 'application/json',
    };

    const response = await fetch(
      `${API_BASE_URL}/check/attempt/email/${encodeURIComponent(email)}/quiz/${encodeURIComponent(quizId)}?companyId=${encodeURIComponent(companyId)}`,
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