import { NextResponse, NextRequest } from 'next/server';
import { QuizResult, ErrorResponse } from '@/types/quizResult';
import { getCompanyId } from '@/lib/company';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL}`;

type ResponseData = QuizResult | QuizResult[] | ErrorResponse;

interface QuizResultResponse {
  results: QuizResult[];
  total: number;
  skip: number;
  limit: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get company ID first
    const companyResult = await getCompanyId(request);
    if ('error' in companyResult) {
      return companyResult.error;
    }
    const { company_id } = companyResult;

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quiz_id');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build the URL with query parameters
    let url: URL;
    
    if (quizId) {
      // Get results for a specific quiz
      url = new URL(`${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}/quiz/${encodeURIComponent(quizId)}`);
    } else {
      // Get all results for the company
      url = new URL(`${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}`);
    }
    
    if (skip) url.searchParams.append('skip', skip.toString());
    if (limit) url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data: QuizResult[] = await response.json();
    
    // Return the response in the expected format
    const result: QuizResultResponse = {
      results: data,
      total: data.length, // Note: This is just the count of returned items, not the total count
      skip,
      limit
    };
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to fetch quiz results' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get company ID first
    const companyResult = await getCompanyId(request);
    if ('error' in companyResult) {
      return companyResult.error;
    }
    const { company_id } = companyResult;

    const { quiz_id, username, user_email, user_answers, result, attempt } = await request.json();

    // Validate required fields
    if (!quiz_id || !username || !user_email || !user_answers || !result || attempt === undefined) {
      return NextResponse.json(
        { detail: 'Missing required fields: quiz_id, company_id, username, user_email, user_answers, result, and attempt are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        quiz_id,
        company_id,
        username,
        user_email,
        user_answers,
        result,
        attempt: parseInt(attempt, 10)
      }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data: QuizResult = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz result:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Failed to create quiz result' },
      { status: 500 }
    );
  }
}
