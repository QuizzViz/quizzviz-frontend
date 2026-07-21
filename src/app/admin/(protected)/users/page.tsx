'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Trash2, X } from 'lucide-react';

interface UserPlan {
  user_id: string;
  plan_name: string;
  email: string | null;
  first_name: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

const PLAN_OPTIONS = ['Free', 'Growth', 'Scale', 'Enterprise'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ user_id: '', email: '', first_name: '', plan_name: 'Free', company_id: '' });
  const [error, setError] = useState<string | null>(null);

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
      setForm({ user_id: '', email: '', first_name: '', plan_name: 'Free', company_id: '' });
      load(search);
    } catch {
      setError('Something went wrong');
    }
  };

  const handlePlanChange = async (userId: string, planName: string) => {
    await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_name: planName }),
    });
    load(search);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(`Delete user plan record for ${userId}?`)) return;
    await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
    load(search);
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
            ) : users.map((u) => (
              <tr key={u.user_id} className="hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{u.first_name || '—'}</div>
                  <div className="text-xs text-zinc-500">{u.email || u.user_id}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan_name}
                    onChange={(e) => handlePlanChange(u.user_id, e.target.value)}
                    className="rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-white text-sm"
                  >
                    {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-zinc-400">{u.company_id || '—'}</td>
                <td className="px-4 py-3 text-zinc-400">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(u.user_id)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
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
              Use the actual Clerk user id if linking to an existing account.
            </p>
            {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
            <div className="space-y-3">
              <input placeholder="Clerk user_id (required)" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
              <input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
              <input placeholder="Company ID (optional)" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm" />
              <select value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white text-sm">
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
