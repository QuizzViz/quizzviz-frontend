import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const CREATE_COMPANY_URL = process.env.NEXT_PUBLIC_CREATE_COMPANY_SERVICE_URL;

export async function POST(request) {
  try {
    console.log('Starting company creation request');
    
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

    const { name, plan_name, company_size, owner_email, owner_id, company_id } = requestData;
    
    // Ensure owner_id is set from the authenticated user
    const finalOwnerId = (owner_id || userId)?.trim();
    if (!finalOwnerId) {
      console.error('No owner_id provided and could not get user ID from auth');
      return NextResponse.json(
        { error: 'Missing required field: owner_id' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!name?.trim() || !company_size?.trim() || !owner_email?.trim()) {
      console.error('Missing required fields:', { name, company_size, owner_email });
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['name', 'company_size', 'owner_email'],
          received: { 
            name: Boolean(name?.trim()),
            company_size: Boolean(company_size?.trim()),
            owner_email: Boolean(owner_email?.trim())
          }
        },
        { status: 400 }
      );
    }

    // Prepare the request body for the backend
    const requestBody = {
      name: name.trim(),
      plan_name: (plan_name || 'Free').trim(),
      company_size: company_size.trim(),
      owner_id: finalOwnerId,
      owner_email: owner_email.trim(),
      company_id: (company_id || name.toLowerCase().replace(/\s+/g, '-')).trim()
    };

    console.log('Making request to:', `${CREATE_COMPANY_URL}/company`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 20)}...`
    });
    
    let response;
    try {
      response = await fetch(`${CREATE_COMPANY_URL}/company`, {
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
        // Log detailed error information
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
            error: responseData.message || `Failed to create company: ${response.statusText}`,
            details: responseData.details || responseData,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Company created successfully:', responseData);
      return NextResponse.json(responseData);
      
    } catch (error) {
      console.error('Error in company creation:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create company',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating company' },
      { status: 500 }
    );
  }
}
