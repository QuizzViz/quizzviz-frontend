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
    const { company_id, company_name, name, invited_email, from_email, role } = requestData;

    // Validate required fields
    if (!company_id?.trim() || !company_name?.trim() || !name?.trim() || !invited_email?.trim() || !from_email?.trim() || !role?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: company_id, company_name, name, invited_email, from_email, role' },
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
      company_id: company_id.trim(),
      company_name: company_name.trim(),
      name: name.trim(),
      invited_email: invited_email.trim().toLowerCase(),
      from_email: from_email.trim().toLowerCase(),
      role: role.trim().toUpperCase()
    };

    let response;
    try {
      response = await fetch(`${COMPANY_MEMBERS_URL}/invite_member`, {
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
          error: responseData.message || `Failed to send invitation: ${response.statusText}`,
          details: responseData.details || responseData,
          status: response.status
        },
        { status: response.status }
      );
    }

    console.log('Invitation sent successfully:', responseData);
    return NextResponse.json(responseData);
      
  } catch (error) {
    console.error('Error in invite member endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send invitation',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
