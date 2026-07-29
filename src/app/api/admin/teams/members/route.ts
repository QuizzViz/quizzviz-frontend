import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

const VALID_ROLES = ['OWNER', 'ADMIN', 'MEMBER'];

// Edit a single team member's name/role directly from the admin panel —
// bypasses the per-company dashboard's own role-permission checks since this
// is a superadmin action, not a company-scoped one.
export async function PATCH(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, name, role } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: `role must be one of ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    if (name !== undefined) { values.push(name); sets.push(`name = $${values.length}`); }
    if (role !== undefined) { values.push(role); sets.push(`role = $${values.length}`); }
    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    sets.push('updated_at = NOW()');
    values.push(id);

    const db = getAdminDb();
    const result = await db.query(
      `UPDATE company_members SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, member: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update member' }, { status: 500 });
  }
}

// Accepts one or more `id` params (?id=a&id=b&...) so a whole team (or a
// multi-select of members) can be removed in a single request.
export async function DELETE(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ids = request.nextUrl.searchParams.getAll('id');
  if (ids.length === 0) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    const result = await db.query('DELETE FROM company_members WHERE id = ANY($1::text[])', [ids]);
    return NextResponse.json({ success: true, deleted: result.rowCount ?? ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete member(s)' }, { status: 500 });
  }
}
