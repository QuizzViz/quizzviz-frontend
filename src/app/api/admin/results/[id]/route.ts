import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const db = getAdminDb();

    const attemptResult = await db.query(
      `SELECT qu.*, c.name AS company_name
       FROM quizz_users qu
       LEFT JOIN companies c ON c.company_id = qu.company_id
       WHERE qu.id = $1`,
      [id]
    );

    if (attemptResult.rowCount === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const attempt = attemptResult.rows[0];

    const quizResult = await db.query(
      `SELECT quiz_id, role, experience, num_questions, quiz_type, quiz
       FROM generated_quizzes WHERE quiz_id = $1`,
      [attempt.quiz_id]
    );

    const highestResult = await db.query(
      `SELECT MAX((result->>'score')::numeric) AS highest_score
       FROM quizz_users WHERE quiz_id = $1`,
      [attempt.quiz_id]
    );

    return NextResponse.json({
      attempt,
      quiz: quizResult.rows[0] || null,
      highest_score: highestResult.rows[0]?.highest_score !== null ? Number(highestResult.rows[0].highest_score) : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch attempt' }, { status: 500 });
  }
}
