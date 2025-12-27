import { NextResponse, NextRequest } from 'next/server';
import { QuizResult, ErrorResponse } from '@/types/quizResult';
import { getCompanyId } from '@/lib/company';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL}`;

type ResponseData = QuizResult | QuizResult[] | ErrorResponse;

interface QuizResultResponse {
  results: QuizResult[];
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get company ID first
    const companyResult = await getCompanyId(request);
    if ('error' in companyResult) {
      console.error('Error getting company ID:', companyResult.error);
      return companyResult.error;
    }
    const { company_id } = companyResult;
    console.log('Company ID from token:', company_id);

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quiz_id');
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '1000';

    // Build the URL with query parameters
    let url: string;
    
    if (quizId) {
      // Get results for a specific quiz
      url = `${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}/quiz/${encodeURIComponent(quizId)}`;
    } else {
      // Get all results for the company
      url = `${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}`;
    }

    // Add pagination parameters
    const apiUrl = new URL(url);
    apiUrl.searchParams.append('skip', skip);
    apiUrl.searchParams.append('limit', limit);

    console.log('Making request to:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
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

    // Get company_id from request body first, fallback to auth token if not provided
    let company_id = requestBody.company_id;
    
    // If company_id is not in request body, try to get it from auth token
    if (!company_id) {
      const companyResult = await getCompanyId(request);
      if ('error' in companyResult) {
        console.warn('No company_id in request body and failed to get from auth:', companyResult.error);
        return companyResult.error;
      }
      company_id = companyResult.company_id;
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
