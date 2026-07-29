'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteModal } from '../../ConfirmDeleteModal';
import { useAdminData, invalidateAdminData } from '../../useAdminData';
import { AdminPageLoading, AdminErrorState } from '../../AdminPageLoading';

type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface TeamMember {
  id: string;
  user_id: string | null;
  company_id: string;
  name: string;
  role: MemberRole;
  status: 'ACTIVE' | 'INVITED';
  invited_email: string | null;
  invite_expires_at: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyInfo {
  company_id: string;
  name: string;
  owner_email: string;
  plan_name: string;
}

interface TeamData {
  company: CompanyInfo;
  members: TeamMember[];
}

function roleBadgeClass(role: MemberRole) {
  switch (role) {
    case 'OWNER': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'ADMIN': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    default: return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  }
}

export default function AdminTeamDetailPage() {
  const params = useParams();
  const companyId = params?.companyId as string;
  const { toast } = useToast();

  const cacheKey = `admin-team-${companyId || 'unknown'}`;
  const { data, isLoading, error, refresh } = useAdminData<TeamData>(cacheKey, async () => {
    if (!companyId) throw new Error('Missing company id');
    const res = await fetch(`/api/admin/teams/${encodeURIComponent(companyId)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to load team (${res.status})`);
    }
    return res.json();
  });

  const members = data?.members || [];
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const allSelected = members.length > 0 && members.every((m) => selected[m.id]);
  const someSelected = members.some((m) => selected[m.id]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  const toggleOne = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      members.forEach((m) => { next[m.id] = true; });
      setSelected(next);
    }
  };

  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<MemberRole>('MEMBER');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const openEdit = (m: TeamMember) => {
    setEditTarget(m);
    setEditName(m.name || '');
    setEditRole(m.role);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/admin/teams/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, name: editName.trim(), role: editRole }),
      });
      if (res.ok) {
        toast({
          title: 'Member updated',
          description: `${editName.trim() || 'Member'} was updated.`,
          className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
        });
        setEditTarget(null);
        invalidateAdminData(cacheKey);
        refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        toast({ title: 'Update failed', description: body.error || 'Failed to update member', variant: 'destructive' });
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/teams/members?id=${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: 'Member removed',
          description: `${deleteTarget.name || deleteTarget.invited_email || 'Member'} was removed from the team.`,
          className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
        });
        setDeleteTarget(null);
        invalidateAdminData(cacheKey);
        invalidateAdminData('admin-teams');
        refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        toast({ title: 'Delete failed', description: body.error || 'Failed to remove member', variant: 'destructive' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const qs = new URLSearchParams();
      selectedIds.forEach((id) => qs.append('id', id));
      const res = await fetch(`/api/admin/teams/members?${qs.toString()}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: `${selectedIds.length} member${selectedIds.length === 1 ? '' : 's'} removed`,
          description: 'Removed from the team.',
          className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
        });
        setSelected({});
        setIsBulkDeleteOpen(false);
        invalidateAdminData(cacheKey);
        invalidateAdminData('admin-teams');
        refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        toast({ title: 'Delete failed', description: body.error || 'Failed to remove members', variant: 'destructive' });
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (isLoading) {
    return <AdminPageLoading text="Loading team..." />;
  }

  if (!data) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        {error ? <AdminErrorState message={error} onRetry={refresh} /> : <p className="text-red-400">Team not found.</p>}
        <Link href="/admin/teams" className="text-green-400 text-sm mt-3 inline-block">Back to teams</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/admin/teams" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to teams
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">{data.company.name}</h1>
          <p className="text-sm text-zinc-500">{data.company.company_id} · owned by {data.company.owner_email} · {data.company.plan_name} plan</p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={() => setIsBulkDeleteOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600/15 border border-red-500/40 text-red-300 hover:bg-red-600/25 text-sm font-medium px-3 py-2 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={members.length === 0}
                  className="rounded border-zinc-600 text-green-500 focus:ring-green-500 bg-zinc-800 cursor-pointer"
                  aria-label="Select all team members"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Name</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Email</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Role</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {members.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No team members yet</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={!!selected[m.id]}
                    onChange={() => toggleOne(m.id)}
                    className="rounded border-zinc-600 text-green-500 focus:ring-green-500 bg-zinc-800 cursor-pointer"
                    aria-label={`Select ${m.name || m.invited_email}`}
                  />
                </td>
                <td className="px-4 py-3 text-white whitespace-nowrap">{m.name || '—'}</td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{m.invited_email || '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs rounded-full px-2 py-0.5 border ${roleBadgeClass(m.role)}`}>{m.role}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {m.status === 'ACTIVE' ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-green-500/15 text-green-300 border border-green-500/30">Active</span>
                  ) : (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">Invited</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-3">
                    <button onClick={() => openEdit(m)} className="text-zinc-500 hover:text-white" aria-label={`Edit ${m.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(m)} className="text-zinc-500 hover:text-red-400" aria-label={`Delete ${m.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Edit team member</h3>
              <button onClick={() => setEditTarget(null)} disabled={isSavingEdit} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-400">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-zinc-400">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as MemberRole)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white"
                >
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditTarget(null)}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {isSavingEdit ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Remove this team member?"
        description={<>This removes <span className="text-white font-medium">{deleteTarget?.name || deleteTarget?.invited_email}</span> from {data.company.name}. This cannot be undone.</>}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteModal
        isOpen={isBulkDeleteOpen}
        title={`Remove ${selectedIds.length} member${selectedIds.length === 1 ? '' : 's'}?`}
        description={<>This removes <span className="text-white font-medium">{selectedIds.length}</span> member{selectedIds.length === 1 ? '' : 's'} from {data.company.name}. This cannot be undone.</>}
        isDeleting={isBulkDeleting}
        onCancel={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        confirmLabel={`Delete ${selectedIds.length}`}
      />
    </div>
  );
}
