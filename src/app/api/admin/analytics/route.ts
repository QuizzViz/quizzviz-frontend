import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

interface MonthlyRow { month: Date; count: string }

export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    const [companiesMonthly, quizzesMonthly, publishedMonthly, attemptsMonthly] = await Promise.all([
      db.query<MonthlyRow>(`SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count FROM companies GROUP BY 1 ORDER BY 1`),
      db.query<MonthlyRow>(`SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count FROM generated_quizzes GROUP BY 1 ORDER BY 1`),
      db.query<MonthlyRow>(`SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count FROM published_quizzes GROUP BY 1 ORDER BY 1`),
      db.query<MonthlyRow>(`SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count FROM quizz_users GROUP BY 1 ORDER BY 1`),
    ]);

    const merged = new Map<string, { year: number; month: number; period: string; new_companies: number; quizzes_generated: number; quizzes_published: number; quiz_attempts: number }>();

    const ensure = (d: Date) => {
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const period = `${year}-${String(month).padStart(2, '0')}`;
      if (!merged.has(period)) {
        merged.set(period, { year, month, period, new_companies: 0, quizzes_generated: 0, quizzes_published: 0, quiz_attempts: 0 });
      }
      return merged.get(period)!;
    };

    for (const row of companiesMonthly.rows) ensure(new Date(row.month)).new_companies = parseInt(row.count, 10);
    for (const row of quizzesMonthly.rows) ensure(new Date(row.month)).quizzes_generated = parseInt(row.count, 10);
    for (const row of publishedMonthly.rows) ensure(new Date(row.month)).quizzes_published = parseInt(row.count, 10);
    for (const row of attemptsMonthly.rows) ensure(new Date(row.month)).quiz_attempts = parseInt(row.count, 10);

    const monthly = Array.from(merged.values()).sort((a, b) => a.period.localeCompare(b.period));

    const yearlyMap = new Map<number, { year: number; new_companies: number; quizzes_generated: number; quizzes_published: number; quiz_attempts: number }>();
    for (const m of monthly) {
      if (!yearlyMap.has(m.year)) {
        yearlyMap.set(m.year, { year: m.year, new_companies: 0, quizzes_generated: 0, quizzes_published: 0, quiz_attempts: 0 });
      }
      const y = yearlyMap.get(m.year)!;
      y.new_companies += m.new_companies;
      y.quizzes_generated += m.quizzes_generated;
      y.quizzes_published += m.quizzes_published;
      y.quiz_attempts += m.quiz_attempts;
    }
    const yearly = Array.from(yearlyMap.values()).sort((a, b) => a.year - b.year);

    const totalsResult = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM companies) AS total_companies,
        (SELECT COUNT(*) FROM generated_quizzes) AS total_quizzes_generated,
        (SELECT COUNT(*) FROM published_quizzes) AS total_quizzes_published,
        (SELECT COUNT(*) FROM quizz_users) AS total_attempts`
    );

    return NextResponse.json({
      monthly,
      yearly,
      totals: totalsResult.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
