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
    const result = search
      ? await db.query(
          `SELECT * FROM user_plans WHERE email ILIKE $1 OR user_id ILIKE $1 OR first_name ILIKE $1 ORDER BY created_at DESC LIMIT 200`,
          [`%${search}%`]
        )
      : await db.query(`SELECT * FROM user_plans ORDER BY created_at DESC LIMIT 200`);
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
