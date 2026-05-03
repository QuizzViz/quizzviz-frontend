import { NextResponse, NextRequest } from 'next/server';
import { QuizResult, ErrorResponse } from '@/types/quizResult';
import { getAuth } from "@clerk/nextjs/server";
import { getCompanyId } from '@/lib/company';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL}`;

type ResponseData = QuizResult | QuizResult[] | ErrorResponse;

interface QuizResultResponse {
  results: QuizResult[];
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get auth info
    const { getToken, userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }
    
    // Get company ID from query parameters
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');
    const quizId = searchParams.get('quiz_id');
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '10000';

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required as query parameter' },
        { status: 400 }
      );
    }

    const token = await getToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Build the URL with query parameters
    let url: string;
    
    if (quizId) {
      // Get results for a specific quiz
      url = `${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}/quiz/${encodeURIComponent(quizId)}?skip=${skip}&limit=${limit}`;
    } else {
      // Get all results for the company
      url = `${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}?skip=${skip}&limit=${limit}`;
    }

    console.log('Making request to:', url);

    // Get auth token from request headers and pass to backend
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'accept': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      try {
        const error: ErrorResponse = JSON.parse(errorText);
        return NextResponse.json(error, { status: response.status });
      } catch (e) {
        return NextResponse.json(
          { detail: `Failed to parse error response: ${errorText}` },
          { status: response.status }
        );
      }
    }

    const data: QuizResult[] = await response.json();
    console.log('API Response data:', JSON.stringify(data, null, 2));
    
    // Return the response in the expected format
    return NextResponse.json({
      results: data || [],
      total: data?.length || 0,
      skip: parseInt(skip, 10),
      limit: parseInt(limit, 10)
    }, { status: 200 });
  } catch (error: unknown) {
  console.error('Error in GET /api/quiz_result:', error);
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  return NextResponse.json(
    { 
      detail: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    },
    { status: 500 }
  );
}}

export async function POST(request: NextRequest) {
  try {
    // Get the request body first for logging
    const requestBody = await request.json();
    console.log('Received request body:', JSON.stringify(requestBody, null, 2));

    // Get company_id from request body (now required since auth is removed)
    const company_id = requestBody.company_id;
    
    if (!company_id) {
      return NextResponse.json(
        { 
          detail: 'company_id is required in request body'
        },
        { status: 400 }
      );
    }

    const { quiz_id, username, user_email, user_answers, result, attempt } = requestBody;

    // Validate required fields with more specific error messages
    const missingFields = [];
    if (!quiz_id) missingFields.push('quiz_id');
    if (!username) missingFields.push('username');
    if (!user_email) missingFields.push('user_email');
    if (!user_answers) missingFields.push('user_answers');
    if (result === undefined) missingFields.push('result');
    if (attempt === undefined) missingFields.push('attempt');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          detail: `Missing required fields: ${missingFields.join(', ')}`,
          received_data: {
            quiz_id: !!quiz_id,
            username: !!username,
            user_email: !!user_email,
            has_user_answers: !!user_answers,
            has_result: result !== undefined,
            has_attempt: attempt !== undefined
          }
        },
        { status: 400 }
      );
    }

    // Prepare the request payload according to the expected format
    const payload = {
      quiz_id,
      company_id,
      username,
      user_email,
      user_answers: Array.isArray(user_answers) 
        ? user_answers.map(({ question_id, user_answer, is_correct, correct_answer }) => ({
            question_id: String(question_id),
            user_answer: String(user_answer),
            is_correct: Boolean(is_correct),
            correct_answer: String(correct_answer)
          }))
        : [],
      result: typeof result === 'string' ? JSON.parse(result) : result,
      attempt: typeof attempt === 'number' ? attempt : parseInt(attempt, 10)
    };

    console.log('Sending to API:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_BASE_URL}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorResponse;
      try {
        errorResponse = await response.text();
        // Try to parse as JSON, but fall back to text if it's not valid JSON
        try {
          errorResponse = JSON.parse(errorResponse);
        } catch (e) {
          console.error('Error parsing error response as JSON:', e);
        }
      } catch (error) {
        console.error('Error reading error response:', error);
        errorResponse = { detail: 'Unknown error occurred' };
      }
      
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorResponse
      });
      
      return NextResponse.json(
        typeof errorResponse === 'object' ? errorResponse : { detail: errorResponse },
        { status: response.status }
      );
    }

    const data: QuizResult = await response.json().catch(async (error) => {
      console.error('Error parsing success response:', error);
      const text = await response.text();
      console.log('Raw response:', text);
      return { success: true, message: 'Result submitted successfully' };
    });
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz result:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to create quiz result' },
      { status: 500 }
    );
  }
}
