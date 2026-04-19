import { getAuth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';

const COMPANY_MEMBERS_URL = process.env.NEXT_PUBLIC_COMPANY_MEMBERS_SERVICE_URL;

// PUT - Update a company member (role)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting company member update request for ID:', params.id);
    
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
        { error: 'Invalid request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400 }
      );
    }

    const { role } = requestData;
    
    // Validate role
    if (!role?.trim()) {
      console.error('Missing required field: role');
      return NextResponse.json(
        { error: 'Missing required field: role' },
        { status: 400 }
      );
    }

    const validRoles = ['OWNER', 'ADMIN', 'MEMBER'];
    
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

    // Prepare the request body for the backend
    const requestBody = {
      role: role.trim().toUpperCase()
    };

    console.log('Making PUT request to:', `${COMPANY_MEMBERS_URL}/member/${params.id}`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    let response;
    try {
      response = await fetch(`${COMPANY_MEMBERS_URL}/member/${params.id}`, {
        method: 'PUT',
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
            error: responseData.message || `Failed to update company member: ${response.statusText}`,
            details: responseData.details || responseData,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Company member updated successfully:', responseData);
      return NextResponse.json(responseData);
      
    } catch (error) {
      console.error('Error in company member update:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update company member',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while updating company member' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a company member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting company member delete request for ID:', params.id);
    
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

    console.log('Making DELETE request to:', `${COMPANY_MEMBERS_URL}/member/${params.id}`);
    
    let response;
    try {
      response = await fetch(`${COMPANY_MEMBERS_URL}/member/${params.id}`, {
        method: 'DELETE',
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
            error: responseData.message || `Failed to delete company member: ${response.statusText}`,
            details: responseData.details || responseData,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Company member deleted successfully');
      return NextResponse.json({ message: 'Member deleted successfully' });
      
    } catch (error) {
      console.error('Error in company member delete:', error);
      return NextResponse.json(
        { 
          error: 'Failed to delete company member',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while deleting company member' },
      { status: 500 }
    );
  }
}
