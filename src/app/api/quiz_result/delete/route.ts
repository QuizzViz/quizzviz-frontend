import { NextResponse } from 'next/server';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL}`;

export async function DELETE(request: Request) {
  console.log('DELETE /api/quiz_result/delete called');
  const { searchParams } = new URL(request.url);
  const quiz_id = searchParams.get('quiz_id');
  const email = searchParams.get('email');
  const company_id = searchParams.get('company_id');

  console.log('Request parameters:', { quiz_id, email, company_id });

  try {
    // Validate required parameters
    if (!quiz_id || !company_id) {
      const error = { message: 'quiz_id and company_id are required' };
      console.error('Validation error:', error);
      return NextResponse.json(error, { status: 400 });
    }

    let url: string;
    
    if (email) {
      // Delete specific user result
      url = `${API_BASE_URL}/result/quiz/${quiz_id}/email/${encodeURIComponent(email)}?company_id=${company_id}`;
    } else {
      // Delete all results for a quiz
      url = `${API_BASE_URL}/result/quiz/${quiz_id}?company_id=${company_id}`;
    }

    console.log('Making request to:', url);

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'accept': 'application/json',
    };

    // Add auth token if present
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        status: response.status,
        statusText: response.statusText,
        url: response.url
      }));
      
      console.error('Error response from API:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData
      });
      
      return NextResponse.json(
        { 
          message: 'Failed to delete quiz result',
          details: errorData
        }, 
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    console.log('Successfully deleted quiz result:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in DELETE /api/quiz_result/delete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
