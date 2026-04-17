import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const COMPANY_MEMBERS_URL = process.env.NEXT_PUBLIC_COMPANY_MEMBERS_SERVICE_URL;

export async function POST(request) {
  try {
    console.log('Starting company member creation request');
    
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

    // Parse and validate request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('Request data:', JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: parseError.message },
        { status: 400 }
      );
    }

    const { user_id, company_id, role, status, id } = requestData;
    
    // Ensure user_id is set from the authenticated user if not provided
    const finalUserId = (user_id || userId)?.trim();
    if (!finalUserId) {
      console.error('No user_id provided and could not get user ID from auth');
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!company_id?.trim() || !role?.trim() || !status?.trim()) {
      console.error('Missing required fields:', { company_id, role, status });
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['company_id', 'role', 'status'],
          received: { 
            company_id: Boolean(company_id?.trim()),
            role: Boolean(role?.trim()),
            status: Boolean(status?.trim())
          }
        },
        { status: 400 }
      );
    }

    // Validate role and status values
    const validRoles = ['OWNER', 'ADMIN', 'MEMBER'];
    const validStatuses = ['ACTIVE', 'INVITED'];
    
    if (!validRoles.includes(role.trim().toUpperCase())) {
      return NextResponse.json(
        { 
          error: 'Invalid role',
          validRoles,
          received: role
        },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(status.trim().toUpperCase())) {
      return NextResponse.json(
        { 
          error: 'Invalid status',
          validStatuses,
          received: status
        },
        { status: 400 }
      );
    }

    // Generate member ID if not provided
    const memberId = id || `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare the request body for the backend
    const requestBody = {
      id: memberId,
      user_id: finalUserId,
      company_id: company_id.trim(),
      role: role.trim().toUpperCase(),
      status: status.trim().toUpperCase(),
      joined_at: status.trim().toUpperCase() === 'ACTIVE' ? new Date().toISOString() : null
    };

    console.log('Making request to:', `${COMPANY_MEMBERS_URL}/member`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    let response;
    try {
      response = await fetch(`${COMPANY_MEMBERS_URL}/member`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        responseData = {};
      }
      
      if (!response.ok) {
        console.error('Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          data: JSON.stringify(responseData, null, 2)
        });

        // Handle 422 Unprocessable Entity (validation errors)
        if (response.status === 422 && responseData.detail) {
          const validationErrors = Array.isArray(responseData.detail) 
            ? responseData.detail.map(err => ({
                field: err.loc?.join('.') || 'unknown',
                message: err.msg || 'Invalid value',
                type: err.type || 'validation_error'
              }))
            : [{ message: responseData.detail }];
          
          console.error('Validation errors:', validationErrors);
          
          return NextResponse.json(
            { 
              error: 'Validation failed',
              details: validationErrors,
              status: response.status
            },
            { status: response.status }
          );
        }
        
        // Handle other error responses
        return NextResponse.json(
          { 
            error: responseData.message || `Failed to create company member: ${response.statusText}`,
            details: responseData.details || responseData,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Company member created successfully:', responseData);
      return NextResponse.json(responseData);
      
    } catch (error) {
      console.error('Error in company member creation:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create company member',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating company member' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    console.log('Starting company members fetch request');
    
    // Get token from request
    const { getToken } = getAuth(request);
    const token = await getToken();
    
    if (!token) {
      console.error('No session token available');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    // Get company_id from query parameters
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');

    if (!company_id?.trim()) {
      console.error('Missing required query parameter: company_id');
      return NextResponse.json(
        { error: 'Missing required query parameter: company_id' },
        { status: 400 }
      );
    }

    console.log('Making request to:', `${COMPANY_MEMBERS_URL}/members?company_id=${company_id.trim()}`);
    
    let response;
    try {
      response = await fetch(`${COMPANY_MEMBERS_URL}/members?company_id=${company_id.trim()}`, {
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
            error: responseData.message || `Failed to fetch company members: ${response.statusText}`,
            details: responseData.details || responseData,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Company members fetched successfully:', responseData);
      return NextResponse.json(responseData);
      
    } catch (error) {
      console.error('Error in company members fetch:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch company members',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching company members' },
      { status: 500 }
    );
  }
}
