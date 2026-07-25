import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

// Lists every company alongside how many company_members rows it has, so the
// admin Teams tab can show "who has how many teammates" without opening each
// company individually.
export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get('q')?.trim() || '';

  try {
    const db = getAdminDb();
    const baseQuery = `
      SELECT c.company_id, c.name, c.owner_email, c.plan_name,
             COALESCE(m.member_count, 0)::int AS member_count
      FROM companies c
      LEFT JOIN (
        SELECT company_id, COUNT(*) AS member_count
        FROM company_members
        GROUP BY company_id
      ) m ON m.company_id = c.company_id
    `;
    const result = search
      ? await db.query(
          `${baseQuery} WHERE c.name ILIKE $1 OR c.owner_email ILIKE $1 OR c.company_id ILIKE $1
           ORDER BY member_count DESC, c.name ASC LIMIT 200`,
          [`%${search}%`]
        )
      : await db.query(`${baseQuery} ORDER BY member_count DESC, c.name ASC LIMIT 200`);
    return NextResponse.json({ companies: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch teams' }, { status: 500 });
  }
}
