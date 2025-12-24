import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const CREATE_COMPANY_URL = process.env.NEXT_PUBLIC_CREATE_COMPANY_SERVICE_URL;

export async function GET(request) {
  console.log('Company check request received');
  try {
    // Get token from request
    const { getToken } = getAuth(request);
    const token = await getToken();
    
    console.log('Token retrieved, checking if exists');
    if (!token) {
      console.error('No token found in request');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    // Get owner_id from query params
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('owner_id');
    
    console.log('Checking company for owner_id:', ownerId);
    if (!ownerId) {
      console.error('No owner_id provided in request');
      return NextResponse.json(
        { error: 'Missing owner_id parameter' },
        { status: 400 }
      );
    }

    // Make request to check company
    const url = `${CREATE_COMPANY_URL}/companies?owner_id=${ownerId}`;
    console.log('Making request to:', url);
    console.log('Using token:', token.substring(0, 20) + '...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    console.log('Response status:', response.status);

    if (response.status === 200) {
      const companies = await response.json();
      console.log('Companies found:', companies);
      const exists = Array.isArray(companies) && companies.length > 0;
      console.log('Company exists:', exists);
      return NextResponse.json({ 
        exists,
        companies: companies || []
      });
    }

    // If we get here, there was an error
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { 
        error: errorData.message || 'Failed to check company',
        details: errorData
      },
      { status: response.status }
    );

  } catch (error) {
    console.error('Error checking company:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
