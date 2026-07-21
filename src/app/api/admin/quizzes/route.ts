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
      `SELECT g.quiz_id, g.company_id, g.role, g.experience, g.num_questions, g.quiz_type,
              g.is_publish, g.is_deleted, g.created_at, c.name AS company_name,
              p.quiz_public_link,
              COALESCE(a.attempt_count, 0) AS attempt_count
       FROM generated_quizzes g
       LEFT JOIN companies c ON c.company_id = g.company_id
       LEFT JOIN published_quizzes p ON p.quiz_id = g.quiz_id
       LEFT JOIN (
         SELECT quiz_id, COUNT(*) AS attempt_count FROM quizz_users GROUP BY quiz_id
       ) a ON a.quiz_id = g.quiz_id
       WHERE g.is_deleted = false
       ORDER BY g.created_at DESC
       LIMIT 300`
    );
    return NextResponse.json({ quizzes: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const quizId = request.nextUrl.searchParams.get('quiz_id');
  if (!quizId) {
    return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    await db.query('UPDATE generated_quizzes SET is_deleted = true WHERE quiz_id = $1', [quizId]);
    await db.query('DELETE FROM published_quizzes WHERE quiz_id = $1', [quizId]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quiz' }, { status: 500 });
  }
}
