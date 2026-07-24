import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';
import { validateQuizPayload, buildQuizContent } from '@/lib/adminQuizValidation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { quizId } = await params;

  try {
    const db = getAdminDb();

    const quizResult = await db.query(
      `SELECT g.*, c.name AS company_name, p.quiz_public_link, p.quiz_key, p.max_attempts,
              p.quiz_time, p.quiz_expiration_time
       FROM generated_quizzes g
       LEFT JOIN companies c ON c.company_id = g.company_id
       LEFT JOIN published_quizzes p ON p.quiz_id = g.quiz_id
       WHERE g.quiz_id = $1`,
      [quizId]
    );

    if (quizResult.rowCount === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const statsResult = await db.query(
      `SELECT
         COUNT(*) AS attempt_count,
         COUNT(DISTINCT user_email) AS unique_candidates,
         MAX((result->>'score')::numeric) AS highest_score,
         AVG((result->>'score')::numeric) AS average_score
       FROM quizz_users
       WHERE quiz_id = $1`,
      [quizId]
    );

    const topAttempt = await db.query(
      `SELECT username, user_email, (result->>'score')::numeric AS score, created_at
       FROM quizz_users
       WHERE quiz_id = $1
       ORDER BY (result->>'score')::numeric DESC NULLS LAST
       LIMIT 1`,
      [quizId]
    );

    return NextResponse.json({
      quiz: quizResult.rows[0],
      stats: {
        attempt_count: Number(statsResult.rows[0]?.attempt_count || 0),
        unique_candidates: Number(statsResult.rows[0]?.unique_candidates || 0),
        highest_score: statsResult.rows[0]?.highest_score !== null ? Number(statsResult.rows[0].highest_score) : null,
        average_score: statsResult.rows[0]?.average_score !== null ? Number(statsResult.rows[0].average_score) : null,
        top_candidate: topAttempt.rows[0] || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quiz' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { quizId } = await params;

  try {
    const body = await request.json();
    const validationError = validateQuizPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const quizContent = buildQuizContent(body.questions);
    const db = getAdminDb();
    const result = await db.query(
      `UPDATE generated_quizzes
       SET company_id = $1, role = $2, experience = $3, quiz_type = $4,
           theory_questions_percentage = $5, code_analysis_questions_percentage = $6,
           num_questions = $7, quiz = $8
       WHERE quiz_id = $9 AND is_deleted = false`,
      [
        body.company_id,
        body.role,
        body.experience,
        body.quiz_type,
        Number(body.theory_questions_percentage) || 0,
        Number(body.code_analysis_questions_percentage) || 0,
        quizContent.length,
        JSON.stringify(quizContent),
        quizId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quiz_id: quizId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save quiz' }, { status: 500 });
  }
}
