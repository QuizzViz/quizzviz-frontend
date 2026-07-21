import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const result = await db.query(
      `SELECT qu.id, qu.quiz_id, qu.company_id, qu.username, qu.user_email, qu.attempt,
              qu.result, qu.created_at, c.name AS company_name
       FROM quizz_users qu
       LEFT JOIN companies c ON c.company_id = qu.company_id
       ORDER BY qu.created_at DESC
       LIMIT 300`
    );
    return NextResponse.json({ results: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch results' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    await db.query('DELETE FROM quizz_users WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete result' }, { status: 500 });
  }
}
