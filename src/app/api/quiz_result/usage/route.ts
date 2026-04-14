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

// Helper function to get company ID for a user
async function getCompanyIdForUsage(userId: string, token: string, request: Request) {
  try {
    // Get origin from request URL
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const url = new URL(`/api/company/check?owner_id=${encodeURIComponent(userId)}`, baseUrl).toString();
    
    console.log('Fetching company info from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch company info:', response.status, errorText);
      throw new Error('Failed to fetch company information');
    }

    const data = await response.json();
    console.log('Company check response:', data);
    
    // Check if company exists and has data
    if (!data.exists || !Array.isArray(data.companies) || data.companies.length === 0) {
      console.error('No company found for user:', userId);
      throw new Error('No company found for this user');
    }

    // Get first company from array
    const company = data.companies[0];
    console.log('Company data:', company);
    
    // Extract company_id from company object
    const companyId = company.company_id;
    
    if (!companyId) {
      console.error('Company ID not found in company data:', company);
      throw new Error('Company ID not found in response');
    }

    console.log('Found company ID:', companyId);
    return companyId;
  } catch (error) {
    console.error('Error in getCompanyIdForUsage:', error);
    throw new Error('Failed to get company information');
  }
}

export async function GET(request: NextRequest) {
  // Create a NextRequest object from incoming request
  const nextRequest = new NextRequest(request);
  try {
    const auth = getAuth(nextRequest);
    const { userId } = auth;
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'No user ID found in session'
        },
        { status: 401 }
      );
    }

    // Get session token from cookies
    const cookieHeader = nextRequest.cookies.toString();
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...vals] = c.trim().split('=');
        return [key, vals.join('=')];
      })
    );
    
    const sessionToken = cookies.__session || '';
    
    if (!sessionToken) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'No authentication token provided in cookies'
        },
        { status: 401 }
      );
    }

    // Get company ID for user
    const company_id = await getCompanyIdForUsage(userId, sessionToken, request);
    console.log('Company ID from token:', company_id);

    // Build the URL for company usage endpoint
    const url = `${API_BASE_URL}/result/owner/${encodeURIComponent(company_id)}/usage`;
    console.log('Making request to:', url);

    // Use session token for authentication
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    };

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
