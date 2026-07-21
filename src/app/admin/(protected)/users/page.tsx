'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, X, Pencil, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface UserPlan {
  user_id: string;
  plan_name: string;
  email: string | null;
  first_name: string | null;
  company_id: string | null;
  company_name: string | null;
  company_plan_name: string | null;
  company_plan_expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

function planBadgeClass(plan: string) {
  switch (plan) {
    case 'Enterprise': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'Scale': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'Growth': return 'bg-green-500/15 text-green-300 border-green-500/30';
    default: return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  }
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ user_id: '', email: '', first_name: '', company_id: '' });
  const [error, setError] = useState<string | null>(null);
  const [editingCompanyFor, setEditingCompanyFor] = useState<string | null>(null);
  const [companyIdDraft, setCompanyIdDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(''); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreate = async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }
      setShowCreate(false);
      setForm({ user_id: '', email: '', first_name: '', company_id: '' });
      load(search);
    } catch {
      setError('Something went wrong');
    }
  };

  const startEditCompany = (u: UserPlan) => {
    setEditingCompanyFor(u.user_id);
    setCompanyIdDraft(u.company_id || '');
  };

  const saveCompany = async (userId: string) => {
    await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyIdDraft || null }),
    });
    setEditingCompanyFor(null);
    load(search);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(deleteTarget.user_id)}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: 'User deleted',
          description: `${deleteTarget.first_name || deleteTarget.email || deleteTarget.user_id} was removed.`,
          className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
        });
        setDeleteTarget(null);
        load(search);
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Delete failed', description: data.error || 'Failed to delete user', variant: 'destructive' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Users</h1>
          <p className="text-sm text-zinc-500 mt-1">{users.length} user plan records</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          <Plus className="h-4 w-4" /> New User
        </button>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, user id, or name..."
          className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No users found</td></tr>
            ) : users.map((u) => {
              // The real plan/billing lives on the user's company — fall back to
              // the legacy per-user value only when there's no company linked.
              const effectivePlan = u.company_id ? (u.company_plan_name || 'Free') : u.plan_name;
              return (
                <tr key={u.user_id} className="hover:bg-zinc-900/60">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{u.first_name || '—'}</div>
                    <div className="text-xs text-zinc-500">{u.email || u.user_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${planBadgeClass(effectivePlan)}`}>
                      {effectivePlan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editingCompanyFor === u.user_id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={companyIdDraft}
                          onChange={(e) => setCompanyIdDraft(e.target.value)}
                          placeholder="company_id"
                          className="rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-white text-xs w-32"
                        />
                        <button onClick={() => saveCompany(u.user_id)} className="text-green-400 hover:text-green-300">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingCompanyFor(null)} className="text-zinc-500 hover:text-white">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : u.company_id ? (
                      <div className="flex items-center gap-1.5 group">
                        <Link href={`/admin/companies/${encodeURIComponent(u.company_id)}`} className="text-green-400 hover:text-green-300">
                          {u.company_name || u.company_id}
                        </Link>
                        <button onClick={() => startEditCompany(u)} className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100">
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEditCompany(u)} className="text-xs text-zinc-500 hover:text-white border border-dashed border-zinc-700 rounded px-2 py-0.5">
                        + Assign company
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDeleteTarget(u)} className="text-zinc-500 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create User Plan Record</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              This creates/updates a plan record only — it does not create a Clerk login account.
              Use the actual Clerk user id if linking to an existing account. Plan/billing is managed
              per-company from the Companies &amp; Billing page, not here.
            </p>
            {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
            <div className="space-y-3">
              <input placeholder="Clerk user_id (required)" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
              <input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
              <input placeholder="Company ID (optional)" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white">Create</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete this user record?"
        description={<>This permanently removes the plan record for <span className="text-white font-medium">{deleteTarget?.first_name || deleteTarget?.email || deleteTarget?.user_id}</span>. This cannot be undone.</>}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
