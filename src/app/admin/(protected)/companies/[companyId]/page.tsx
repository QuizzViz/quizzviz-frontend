'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Save } from 'lucide-react';

interface CustomLimits {
  maxQuizzes?: number;
  maxCandidates?: number;
  maxQuestions?: number;
  maxTeamMembers?: number;
}

interface Company {
  company_id: string;
  name: string;
  plan_name: string;
  company_size: string;
  owner_id: string;
  owner_email: string;
  plan_start_date: string | null;
  plan_expiry_date: string | null;
  billing_cycle: string;
  custom_limits: CustomLimits | null;
  created_at: string;
  updated_at: string;
}

const PLAN_OPTIONS = ['Free', 'Growth', 'Scale', 'Enterprise'];
const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half-Yearly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function AdminCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.companyId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(companyId)}`);
      const data = await res.json();
      if (res.ok) setCompany(data.company);
      else setMessage({ type: 'error', text: data.error || 'Failed to load company' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (companyId) load(); }, [companyId]);

  const update = (patch: Partial<Company>) => setCompany((prev) => prev ? { ...prev, ...patch } : prev);
  const updateLimits = (patch: Partial<CustomLimits>) =>
    setCompany((prev) => prev ? { ...prev, custom_limits: { ...(prev.custom_limits || {}), ...patch } } : prev);

  const handleSave = async () => {
    if (!company) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(companyId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company.name,
          company_size: company.company_size,
          plan_name: company.plan_name,
          billing_cycle: company.billing_cycle,
          plan_start_date: company.plan_start_date,
          plan_expiry_date: company.plan_expiry_date,
          custom_limits: company.custom_limits,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
        return;
      }
      setCompany(data.company);
      setMessage({ type: 'success', text: 'Saved successfully.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/admin/companies/${encodeURIComponent(companyId)}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/companies');
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading...</div>;
  }

  if (!company) {
    return (
      <div className="p-8">
        <p className="text-red-400">{message?.text || 'Company not found.'}</p>
        <Link href="/admin/companies" className="text-green-400 text-sm mt-2 inline-block">Back to companies</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/admin/companies" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to companies
      </Link>

      <h1 className="text-2xl font-semibold text-white mb-1">{company.name}</h1>
      <p className="text-sm text-zinc-500 mb-6">{company.company_id} · owned by {company.owner_email}</p>

      {message && (
        <div className={`mb-5 rounded-lg border px-4 py-2.5 text-sm ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Company name</label>
            <input
              value={company.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Company size</label>
            <input
              value={company.company_size || ''}
              onChange={(e) => update({ company_size: e.target.value })}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
              placeholder="e.g. 11-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Plan</label>
            <select
              value={company.plan_name}
              onChange={(e) => update({ plan_name: e.target.value })}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
            >
              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Billing cycle</label>
            <select
              value={company.billing_cycle || 'monthly'}
              onChange={(e) => update({ billing_cycle: e.target.value })}
              disabled={company.plan_name === 'Free'}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white disabled:opacity-50"
            >
              {BILLING_CYCLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Plan start date</label>
            <input
              type="date"
              value={company.plan_start_date || ''}
              onChange={(e) => update({ plan_start_date: e.target.value })}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Plan expiry date</label>
            <input
              type="date"
              value={company.plan_expiry_date || ''}
              onChange={(e) => update({ plan_expiry_date: e.target.value })}
              disabled={company.plan_name === 'Free'}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white disabled:opacity-50"
            />
            <p className="text-xs text-zinc-600">Leave as-is to auto-compute from start date + cycle. Override to set a custom date.</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2">Custom usage limits (overrides plan defaults, optional)</label>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-600">Max quizzes/period</label>
              <input
                type="number"
                value={company.custom_limits?.maxQuizzes ?? ''}
                onChange={(e) => updateLimits({ maxQuizzes: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Max candidates</label>
              <input
                type="number"
                value={company.custom_limits?.maxCandidates ?? ''}
                onChange={(e) => updateLimits({ maxCandidates: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Max questions/quiz</label>
              <input
                type="number"
                value={company.custom_limits?.maxQuestions ?? ''}
                onChange={(e) => updateLimits({ maxQuestions: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Max team members</label>
              <input
                type="number"
                value={company.custom_limits?.maxTeamMembers ?? ''}
                onChange={(e) => updateLimits({ maxTeamMembers: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-white text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" /> Delete company
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-5 py-2 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Delete this company?</h3>
            <p className="text-sm text-zinc-400 mb-5">This permanently removes {company.name} from the database. This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
