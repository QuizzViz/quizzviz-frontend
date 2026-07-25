import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// GET - Fetch every published quiz for a company in one call (avoids N+1
// calls to the single-quiz GET route at /api/publish/[company_id]/[quizId]).
// Used by My Quizzes and Analytics to get max_attempts/quiz_expiration_time/
// quiz_key for all of a company's quizzes at once.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const { userId: authUserId, getToken } = getAuth(request);

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    const publishServiceUrl = `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/user/${companyId}/quizzes?limit=1000`;

    const headers = new Headers();
    headers.append('accept', 'application/json');
    headers.append('Authorization', `Bearer ${token}`);
    headers.append('x-company-id', companyId);
    headers.append('x-user-id', authUserId);

    const response = await fetch(publishServiceUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorDetails;
      try {
        const errorData = await response.json();
        errorDetails = errorData.detail || errorData.message || 'Unknown error';
      } catch {
        errorDetails = await response.text().catch(() => 'Unknown error');
      }
      return NextResponse.json(
        { error: 'Failed to fetch published quizzes', details: errorDetails },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({ success: true, quizzes: Array.isArray(data) ? data : [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
