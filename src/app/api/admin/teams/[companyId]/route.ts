import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { companyId } = await params;
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const companyResult = await db.query(
      `SELECT company_id, name, owner_email, plan_name FROM companies WHERE company_id = $1`,
      [companyId]
    );
    if (companyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const membersResult = await db.query(
      `SELECT id, user_id, company_id, name, role, status,
              invited_email, invite_expires_at, joined_at, created_at, updated_at
       FROM company_members
       WHERE company_id = $1
       ORDER BY CASE role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END, created_at ASC`,
      [companyId]
    );

    return NextResponse.json({ company: companyResult.rows[0], members: membersResult.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch team members' }, { status: 500 });
  }
}
