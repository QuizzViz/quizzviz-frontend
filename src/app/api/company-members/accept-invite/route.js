import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const COMPANY_MEMBERS_URL = process.env.NEXT_PUBLIC_COMPANY_MEMBERS_SERVICE_URL;

async function verifyToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

export async function POST(request) {
  try {
    const token = await verifyToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    const { token: inviteToken, user_id } = requestData;

    // Validate required fields
    if (!inviteToken?.trim() || !user_id?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: token, user_id' },
        { status: 400 }
      );
    }

    if (!COMPANY_MEMBERS_URL) {
      console.error('COMPANY_MEMBERS_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Prepare the request body for the backend
    const requestBody = {
      token: inviteToken.trim(),
      user_id: user_id.trim()
    };

    let response;
    try {
      response = await fetch(`${COMPANY_MEMBERS_URL}/accept_invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
    } catch (fetchError) {
      console.error('Failed to connect to company members service:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to company members service',
          details: fetchError.message
        },
        { status: 503 }
      );
    }

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
          error: responseData.message || `Failed to accept invitation: ${response.statusText}`,
          details: responseData.details || responseData,
          status: response.status
        },
        { status: response.status }
      );
    }

    console.log('Invitation accepted successfully:', responseData);
    return NextResponse.json(responseData);
      
  } catch (error) {
    console.error('Error in accept invite endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to accept invitation',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
