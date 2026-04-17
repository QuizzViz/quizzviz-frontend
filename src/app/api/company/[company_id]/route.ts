import { NextResponse } from 'next/server';

const CREATE_COMPANY_URL = process.env.NEXT_PUBLIC_CREATE_COMPANY_SERVICE_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ company_id: string }> }
) {
  const resolvedParams = await params;
  console.log('Company info request received for company_id:', resolvedParams.company_id);
  
  try {
    const { company_id } = resolvedParams;
    
    if (!company_id) {
      console.error('No company_id provided in request');
      return NextResponse.json(
        { error: 'Missing company_id parameter' },
        { status: 400 }
      );
    }

    // Make request to get company by ID (no auth required)
    const url = `${CREATE_COMPANY_URL}/company/${encodeURIComponent(company_id)}`;
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);

    if (response.status === 200) {
      const company = await response.json();
      console.log('Company found:', company);
      return NextResponse.json(company);
    }

    // If we get here, there was an error
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { 
        error: errorData.detail || 'Failed to fetch company',
        details: errorData
      },
      { status: response.status }
    );

  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
