import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getAdminDb } from '@/lib/adminDb';
import { computePeriodEnd } from '@/lib/billingCycle';

const ALLOWED_BILLING_CYCLES = new Set(['monthly', 'quarterly', 'half_yearly', 'yearly']);

export async function GET(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { companyId } = await params;
  try {
    const db = getAdminDb();
    const result = await db.query('SELECT * FROM companies WHERE company_id = $1', [companyId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ company: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { companyId } = await params;

  try {
    const body = await request.json();
    const db = getAdminDb();

    const existingResult = await db.query('SELECT * FROM companies WHERE company_id = $1', [companyId]);
    if (existingResult.rowCount === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const existing = existingResult.rows[0];

    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    const setField = (column: string, value: any) => {
      fields.push(`${column} = $${i}`);
      values.push(value);
      i += 1;
    };

    if (typeof body.name === 'string') setField('name', body.name);
    if (typeof body.company_size === 'string') setField('company_size', body.company_size);
    if (typeof body.custom_limits === 'object') setField('custom_limits', body.custom_limits ? JSON.stringify(body.custom_limits) : null);

    const planNameChanging = typeof body.plan_name === 'string' && body.plan_name !== existing.plan_name;
    const billingCycleProvided = typeof body.billing_cycle === 'string' && ALLOWED_BILLING_CYCLES.has(body.billing_cycle);
    const planStartProvided = typeof body.plan_start_date === 'string' && body.plan_start_date;
    const planExpiryProvided = typeof body.plan_expiry_date === 'string' && body.plan_expiry_date;

    let planName = existing.plan_name;
    if (typeof body.plan_name === 'string') {
      planName = body.plan_name;
      setField('plan_name', planName);
    }

    if (planName === 'Free') {
      setField('billing_cycle', 'monthly');
      setField('plan_expiry_date', null);
      setField('plan_start_date', planStartProvided ? body.plan_start_date : new Date().toISOString().slice(0, 10));
    } else {
      const billingCycle = billingCycleProvided ? body.billing_cycle : (existing.billing_cycle || 'monthly');
      const planStartDate = planStartProvided
        ? body.plan_start_date
        : (planNameChanging || !existing.plan_start_date ? new Date().toISOString().slice(0, 10) : existing.plan_start_date);

      if (billingCycleProvided || planNameChanging || planStartProvided) {
        setField('billing_cycle', billingCycle);
      }
      if (planNameChanging || planStartProvided) {
        setField('plan_start_date', planStartDate);
      }

      if (planExpiryProvided) {
        setField('plan_expiry_date', body.plan_expiry_date);
      } else if (planNameChanging || billingCycleProvided || planStartProvided) {
        // Deterministic expiry from anchor + cycle — same rule the backend enforces.
        const startDateObj = new Date(`${planStartDate}T00:00:00Z`);
        const computedExpiry = computePeriodEnd(startDateObj, billingCycle);
        setField('plan_expiry_date', computedExpiry.toISOString().slice(0, 10));
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    setField('updated_at', new Date().toISOString());
    values.push(companyId);

    const query = `UPDATE companies SET ${fields.join(', ')} WHERE company_id = $${i} RETURNING *`;
    const result = await db.query(query, values);

    return NextResponse.json({ company: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { companyId } = await params;
  try {
    const db = getAdminDb();
    const result = await db.query('DELETE FROM companies WHERE company_id = $1', [companyId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete company' }, { status: 500 });
  }
}
