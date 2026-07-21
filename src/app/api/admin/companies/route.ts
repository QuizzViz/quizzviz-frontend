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
          `SELECT company_id, name, plan_name, company_size, owner_id, owner_email,
                  plan_start_date, plan_expiry_date, billing_cycle, custom_limits,
                  created_at, updated_at
           FROM companies
           WHERE name ILIKE $1 OR owner_email ILIKE $1 OR company_id ILIKE $1
           ORDER BY created_at DESC
           LIMIT 200`,
          [`%${search}%`]
        )
      : await db.query(
          `SELECT company_id, name, plan_name, company_size, owner_id, owner_email,
                  plan_start_date, plan_expiry_date, billing_cycle, custom_limits,
                  created_at, updated_at
           FROM companies
           ORDER BY created_at DESC
           LIMIT 200`
        );
    return NextResponse.json({ companies: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch companies' }, { status: 500 });
  }
}
