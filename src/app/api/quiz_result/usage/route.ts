import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { getCompanyId } from '@/lib/company';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_QUIZZ_RESULT_SERVICE_URL}`;

interface CompanyUsageResponse {
  company_id: string;
  current_month: {
    unique_candidates: number;
    total_attempts: number;
  };
  previous_month: {
    unique_candidates: number;
    total_attempts: number;
  };
  all_months: Array<{
    year: number;
    month: number;
    unique_candidates: number;
    total_attempts: number;
  }>;
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
    
    if (!company_id) {
      return NextResponse.json(
        { 
          error: 'company_id is required',
          details: 'Please provide company_id as a query parameter'
        },
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

    // Build the URL for company usage endpoint
    const url = `${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}/usage`;
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
        const error = JSON.parse(errorText);
        return NextResponse.json(error, { status: response.status });
      } catch (e) {
        return NextResponse.json(
          { detail: `Failed to parse error response: ${errorText}` },
          { status: response.status }
        );
      }
    }

    const data: CompanyUsageResponse = await response.json();
    console.log('API Response data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/quiz_result/usage:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        detail: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}
