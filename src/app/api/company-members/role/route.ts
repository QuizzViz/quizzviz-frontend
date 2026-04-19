import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const COMPANY_MEMBERS_URL = process.env.NEXT_PUBLIC_COMPANY_MEMBERS_SERVICE_URL;

export async function GET(request: NextRequest) {
  try {
    console.log('Starting member role fetch request');
    
    // Get token and user ID from request
    const { getToken, userId } = getAuth(request);
    const token = await getToken();
    
    if (!token) {
      console.error('No session token available');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const company_id = searchParams.get('company_id');

    if (!user_id?.trim() || !company_id?.trim()) {
      console.error('Missing required query parameters:', { user_id, company_id });
      return NextResponse.json(
        { 
          error: 'Missing required query parameters',
          required: ['user_id', 'company_id'],
          received: { user_id, company_id }
        },
        { status: 400 }
      );
    }

    console.log('Fetching member role:', { user_id, company_id });

    let response;
    try {
      response = await fetch(`${COMPANY_MEMBERS_URL}/member/role?user_id=${encodeURIComponent(user_id.trim())}&company_id=${encodeURIComponent(company_id.trim())}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        responseData = {};
      }
      
      if (!response.ok) {
        console.error('Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          data: JSON.stringify(responseData, null, 2)
        });
        
        return NextResponse.json(
          { 
            error: responseData.message || `Failed to fetch member role: ${response.statusText}`,
            details: responseData.details || responseData,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Member role fetched successfully:', responseData);
      return NextResponse.json(responseData);
      
    } catch (error: unknown) {
      console.error('Error in member role fetch:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch member role',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching member role' },
      { status: 500 }
    );
  }
}
