import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';
import { computeCurrentPeriod } from '@/lib/billingCycle';

// Duplicated from src/config/plans.ts (not imported directly — that module
// pulls in Clerk/react-query client hooks that aren't safe in a server Route
// Handler). Keep these numbers in sync if the plan limits ever change.
const PLAN_LIMITS: Record<string, { maxQuizzes: number; maxCandidates: number }> = {
  Free: { maxQuizzes: 4, maxCandidates: 20 },
  Growth: { maxQuizzes: 30, maxCandidates: 500 },
  Scale: { maxQuizzes: 70, maxCandidates: 2000 },
  Enterprise: { maxQuizzes: -1, maxCandidates: 6000 },
};

export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const companiesResult = await db.query(
      `SELECT company_id, name, plan_name, plan_start_date, billing_cycle, custom_limits
       FROM companies ORDER BY name ASC`
    );

    const today = new Date();
    const usage = await Promise.all(
      companiesResult.rows.map(async (c) => {
        const planStart = c.plan_start_date ? new Date(`${c.plan_start_date}T00:00:00Z`) : null;
        const { periodStart, periodEnd } = computeCurrentPeriod(planStart, c.billing_cycle || 'monthly', today);

        const [quizRes, candidateRes] = await Promise.all([
          db.query(
            `SELECT COUNT(*) AS count FROM generated_quizzes
             WHERE company_id = $1 AND created_at >= $2 AND created_at < $3`,
            [c.company_id, periodStart.toISOString(), periodEnd.toISOString()]
          ),
          db.query(
            `SELECT COUNT(DISTINCT user_email) AS count FROM quizz_users
             WHERE company_id = $1 AND created_at >= $2 AND created_at < $3`,
            [c.company_id, periodStart.toISOString(), periodEnd.toISOString()]
          ),
        ]);

        const baseLimits = PLAN_LIMITS[c.plan_name] || PLAN_LIMITS.Free;
        const customLimits = c.custom_limits || {};
        const maxQuizzes = customLimits.maxQuizzes ?? baseLimits.maxQuizzes;
        const maxCandidates = customLimits.maxCandidates ?? baseLimits.maxCandidates;

        const quizzesUsed = Number(quizRes.rows[0]?.count || 0);
        const candidatesUsed = Number(candidateRes.rows[0]?.count || 0);

        return {
          company_id: c.company_id,
          name: c.name,
          plan_name: c.plan_name,
          billing_cycle: c.billing_cycle || 'monthly',
          period_start: periodStart.toISOString().slice(0, 10),
          period_end: periodEnd.toISOString().slice(0, 10),
          quizzes_used: quizzesUsed,
          quizzes_limit: maxQuizzes,
          quizzes_pct: maxQuizzes === -1 ? 0 : Math.min(100, Math.round((quizzesUsed / Math.max(1, maxQuizzes)) * 100)),
          candidates_used: candidatesUsed,
          candidates_limit: maxCandidates,
          candidates_pct: maxCandidates === -1 ? 0 : Math.min(100, Math.round((candidatesUsed / Math.max(1, maxCandidates)) * 100)),
        };
      })
    );

    return NextResponse.json({ usage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch usage' }, { status: 500 });
  }
}
