import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

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

// PUT - Update company settings (name, size). Backend enforces owner-only —
// this proxy just forwards the caller's token and lets it decide.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ company_id: string }> }
) {
  try {
    const { company_id } = await params;

    if (!company_id) {
      return NextResponse.json({ error: 'Missing company_id parameter' }, { status: 400 });
    }

    const { getToken } = getAuth(request);
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No session token' }, { status: 401 });
    }

    let body: { name?: string; company_size?: string };
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, string> = {};
    if (typeof body.name === 'string' && body.name.trim()) updatePayload.name = body.name.trim();
    if (typeof body.company_size === 'string' && body.company_size.trim()) updatePayload.company_size = body.company_size.trim();

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const response = await fetch(`${CREATE_COMPANY_URL}/company/${encodeURIComponent(company_id)}`, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatePayload),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseData.detail || `Failed to update company: ${response.statusText}`,
          details: responseData
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
