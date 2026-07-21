import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId } = await params;
  try {
    const body = await request.json();
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const col of ['plan_name', 'email', 'first_name', 'company_id']) {
      if (col in body) {
        fields.push(`${col} = $${i}`);
        values.push(body[col]);
        i += 1;
      }
    }
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const db = getAdminDb();
    const result = await db.query(
      `UPDATE user_plans SET ${fields.join(', ')} WHERE user_id = $${i} RETURNING *`,
      values
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId } = await params;
  try {
    const db = getAdminDb();
    const result = await db.query('DELETE FROM user_plans WHERE user_id = $1', [userId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
