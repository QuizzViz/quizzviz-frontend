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

    // Get company_id from query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    console.log('Debug - Received parameters:', { email, quizId, companyId });
    console.log('Debug - Full request URL:', request.url);

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

    const backendUrl = `${API_BASE_URL}/check/attempt/email/${encodeURIComponent(email)}/quiz/${encodeURIComponent(quizId)}?company_id=${encodeURIComponent(companyId)}`;
    console.log('Debug - Backend URL:', backendUrl);

    const response = await fetch(
      backendUrl,
      {
        headers,
        cache: 'no-store' // Ensure we don't get cached responses
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log('Debug - Backend error response:', error);
      console.log('Debug - Backend response status:', response.status);
      
      // If quiz data not found, it might mean no one has attempted the quiz yet
      // Allow the user to proceed with 0 attempts
      if (error.detail === "Quiz data not found or access denied") {
        console.log('Debug - No attempts found yet, allowing user to proceed');
        return NextResponse.json({
          email: email,
          quiz_id: quizId,
          attempts: 0
        });
      }
      
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