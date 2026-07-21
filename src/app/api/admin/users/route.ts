import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const search = request.nextUrl.searchParams.get('q')?.trim() || '';
  try {
    const db = getAdminDb();
    // A user's real plan/billing lives on their company, not on this legacy
    // per-user plan_name column — join it in so the UI can show the company
    // (and its actual plan) instead of offering a disconnected per-user editor.
    const baseQuery = `
      SELECT up.*, c.name AS company_name, c.plan_name AS company_plan_name,
             c.plan_expiry_date AS company_plan_expiry_date
      FROM user_plans up
      LEFT JOIN companies c ON c.company_id = up.company_id
    `;
    const result = search
      ? await db.query(
          `${baseQuery} WHERE up.email ILIKE $1 OR up.user_id ILIKE $1 OR up.first_name ILIKE $1 ORDER BY up.created_at DESC LIMIT 200`,
          [`%${search}%`]
        )
      : await db.query(`${baseQuery} ORDER BY up.created_at DESC LIMIT 200`);
    return NextResponse.json({ users: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { user_id, email, first_name, plan_name, company_id } = body;
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    const db = getAdminDb();
    const result = await db.query(
      `INSERT INTO user_plans (user_id, plan_name, email, first_name, company_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         plan_name = EXCLUDED.plan_name, email = EXCLUDED.email,
         first_name = EXCLUDED.first_name, company_id = EXCLUDED.company_id, updated_at = NOW()
       RETURNING *`,
      [user_id, plan_name || 'Free', email || null, first_name || null, company_id || null]
    );
    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
