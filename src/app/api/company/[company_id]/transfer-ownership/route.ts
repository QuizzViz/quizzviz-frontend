import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const CREATE_COMPANY_URL = process.env.NEXT_PUBLIC_CREATE_COMPANY_SERVICE_URL;

// POST - Transfer company ownership to another active company member.
// Backend enforces that only the current owner can call this, and demotes
// the previous owner to ADMIN in the same transaction (never removes them).
export async function POST(
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

    let body: { new_owner_user_id?: string; old_owner_name?: string; old_owner_email?: string };
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400 }
      );
    }

    if (!body.new_owner_user_id?.trim()) {
      return NextResponse.json({ error: 'Missing required field: new_owner_user_id' }, { status: 400 });
    }
    if (!body.old_owner_name?.trim() || !body.old_owner_email?.trim()) {
      return NextResponse.json({ error: 'Missing required field: old_owner_name/old_owner_email' }, { status: 400 });
    }

    const response = await fetch(
      `${CREATE_COMPANY_URL}/company/${encodeURIComponent(company_id)}/transfer-ownership`,
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_owner_user_id: body.new_owner_user_id.trim(),
          old_owner_name: body.old_owner_name.trim(),
          old_owner_email: body.old_owner_email.trim(),
        }),
      }
    );

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseData.detail || `Failed to transfer ownership: ${response.statusText}`,
          details: responseData
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error transferring company ownership:', error);
    return NextResponse.json(
      { error: 'Failed to transfer ownership', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
