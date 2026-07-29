import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_QUIZZ_GENERATION_SERVICE_URL;

// GET - Live count of unpublished quizzes for a company. Backend restricts
// this to Owner/Admin (only they can act on it) — this proxy just forwards
// the caller's token and lets it decide.
export async function GET(request: NextRequest) {
  try {
    const { getToken } = getAuth(request);
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No session token' }, { status: 401 });
    }

    const companyId = request.nextUrl.searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId parameter' }, { status: 400 });
    }

    const response = await fetch(
      `${BACKEND_BASE_URL}/user/${encodeURIComponent(companyId)}/quizzes/pending-publish-count`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // A Member hitting this (no UI path to it, but a direct call is
      // possible) gets the backend's 403 forwarded as-is rather than an error.
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pending-publish count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending-publish count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
