'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Users, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { useAdminData, invalidateAdminData } from '../useAdminData';
import { AdminPageLoading, AdminErrorState } from '../AdminPageLoading';
import { AdminRefreshButton } from '../AdminRefreshButton';
import { AdminPagination, ADMIN_PAGE_SIZE } from '../AdminPagination';

type StatusFilter = 'all' | 'draft' | 'published';

interface QuizRow {
  quiz_id: string;
  company_id: string;
  company_name: string | null;
  company_owner_email: string | null;
  role: string;
  experience: string;
  num_questions: number;
  quiz_type: string;
  is_publish: boolean;
  quiz_public_link: string | null;
  attempt_count: number;
  created_at: string;
}

export default function AdminQuizzesPage() {
  const { toast } = useToast();
  const { data, isLoading, isRefreshing, error, refresh, lastUpdated } = useAdminData<QuizRow[]>('admin-quizzes', async () => {
    const res = await fetch('/api/admin/quizzes');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to load quizzes (${res.status})`);
    }
    const json = await res.json();
    return json.quizzes || [];
  });
  const quizzes = data || [];
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<QuizRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPage(1); setSelected({}); }, [statusFilter, search]);

  const counts = useMemo(() => ({
    all: quizzes.length,
    draft: quizzes.filter((q) => !q.quiz_public_link).length,
    published: quizzes.filter((q) => !!q.quiz_public_link).length,
  }), [quizzes]);

  const visibleQuizzes = useMemo(() => {
    let rows = quizzes;
    if (statusFilter === 'draft') rows = rows.filter((q) => !q.quiz_public_link);
    else if (statusFilter === 'published') rows = rows.filter((q) => !!q.quiz_public_link);

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) =>
        row.role.toLowerCase().includes(q) ||
        (row.company_name || '').toLowerCase().includes(q) ||
        row.company_id.toLowerCase().includes(q) ||
        (row.company_owner_email || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [quizzes, statusFilter, search]);

  const pageCount = Math.max(1, Math.ceil(visibleQuizzes.length / ADMIN_PAGE_SIZE));
  const pagedQuizzes = useMemo(
    () => visibleQuizzes.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE),
    [visibleQuizzes, page]
  );

  // Selection is tracked against the current filter (visibleQuizzes), not just
  // the current page — "select all" + a search for one company/owner email is
  // how deleting every quiz belonging to one person at once is meant to work,
  // even if their quizzes span more than one page.
  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const selectedCount = selectedIds.length;
  const allFilteredSelected = visibleQuizzes.length > 0 && visibleQuizzes.every((q) => selected[q.quiz_id]);
  const someFilteredSelected = visibleQuizzes.some((q) => selected[q.quiz_id]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected && !allFilteredSelected;
    }
  }, [someFilteredSelected, allFilteredSelected]);

  const toggleSelectOne = (quizId: string) => {
    setSelected((prev) => ({ ...prev, [quizId]: !prev[quizId] }));
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = { ...prev };
        visibleQuizzes.forEach((q) => { delete next[q.quiz_id]; });
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = { ...prev };
        visibleQuizzes.forEach((q) => { next[q.quiz_id] = true; });
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const params = new URLSearchParams();
      selectedIds.forEach((id) => params.append('quiz_id', id));
      const res = await fetch(`/api/admin/quizzes?${params.toString()}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: `${selectedIds.length} quiz${selectedIds.length === 1 ? '' : 'zes'} deleted`,
          description: 'Removed from generated and published quizzes.',
          className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
        });
        selectedIds.forEach((id) => invalidateAdminData(`admin-quiz-${id}`));
        setSelected({});
        setIsBulkDeleteOpen(false);
        refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Delete failed', description: data.error || 'Failed to delete quizzes', variant: 'destructive' });
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/quizzes?quiz_id=${encodeURIComponent(deleteTarget.quiz_id)}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: 'Quiz deleted',
          description: `"${deleteTarget.role}" was removed from generated and published quizzes.`,
          className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
        });
        setDeleteTarget(null);
        invalidateAdminData(`admin-quiz-${deleteTarget.quiz_id}`);
        refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Delete failed', description: data.error || 'Failed to delete quiz', variant: 'destructive' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'draft', label: `Generated / Draft (${counts.draft})` },
    { key: 'published', label: `Published (${counts.published})` },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-semibold text-white">Quizzes</h1>
        <div className="flex items-center gap-2">
          <AdminRefreshButton onClick={refresh} isRefreshing={isRefreshing} lastUpdated={lastUpdated} />
          <Link
            href="/admin/quizzes/new"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm font-medium px-4 py-2"
          >
            <Plus className="h-4 w-4" /> New Quiz
          </Link>
        </div>
      </div>
      <p className="text-sm text-zinc-500 mb-5">{visibleQuizzes.length} of {quizzes.length} quizzes shown (most recent 300) — click a row to view its questions</p>

      {error && <div className="mb-5"><AdminErrorState message={error} onRetry={refresh} /></div>}

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 border border-zinc-800 rounded-lg p-1 w-fit bg-zinc-950">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-gradient-to-r from-green-600/20 to-blue-600/20 text-white border border-green-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company, or owner email..."
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>
        {selectedCount > 0 && (
          <button
            onClick={() => setIsBulkDeleteOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600/15 border border-red-500/40 text-red-300 hover:bg-red-600/25 text-sm font-medium px-3 py-2 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete ({selectedCount})
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
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  disabled={visibleQuizzes.length === 0}
                  className="rounded border-zinc-600 text-green-500 focus:ring-green-500 bg-zinc-800 cursor-pointer"
                  aria-label="Select all quizzes matching the current filter"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Role</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Company</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Type</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Experience</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Questions</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Attempts</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={10} className="p-0"><AdminPageLoading /></td></tr>
            ) : visibleQuizzes.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-zinc-500">No quizzes found</td></tr>
            ) : pagedQuizzes.map((q) => (
              <tr
                key={q.quiz_id}
                onClick={() => router.push(`/admin/quizzes/${encodeURIComponent(q.quiz_id)}`)}
                className="hover:bg-zinc-900/60 cursor-pointer"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!selected[q.quiz_id]}
                    onChange={() => toggleSelectOne(q.quiz_id)}
                    className="rounded border-zinc-600 text-green-500 focus:ring-green-500 bg-zinc-800 cursor-pointer"
                    aria-label={`Select ${q.role} quiz`}
                  />
                </td>
                <td className="px-4 py-3 text-white whitespace-nowrap max-w-[200px] truncate" title={q.role}>{q.role}</td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap max-w-[220px]">
                  <div className="truncate" title={q.company_name || q.company_id}>{q.company_name || q.company_id}</div>
                  {q.company_owner_email && <div className="text-xs text-zinc-600 truncate" title={q.company_owner_email}>{q.company_owner_email}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs rounded-full px-2 py-0.5 border ${q.quiz_type === 'non_technical' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
                    {q.quiz_type === 'non_technical' ? 'Non-Technical' : 'Technical'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{q.experience}</td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{q.num_questions}</td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {q.attempt_count}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {q.quiz_public_link ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-green-500/15 text-green-300 border border-green-500/30">Published</span>
                  ) : (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">Draft</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setDeleteTarget(q)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete this quiz?"
        description={<>This removes <span className="text-white font-medium">&quot;{deleteTarget?.role}&quot;</span> from generated and published quizzes{deleteTarget?.attempt_count ? <> — <span className="text-orange-300">{deleteTarget.attempt_count} candidate attempt(s) already exist for it</span></> : null}. This cannot be undone.</>}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteModal
        isOpen={isBulkDeleteOpen}
        title={`Delete ${selectedCount} quiz${selectedCount === 1 ? '' : 'zes'}?`}
        description={<>This removes <span className="text-white font-medium">{selectedCount}</span> quiz{selectedCount === 1 ? '' : 'zes'} from generated and published quizzes. This cannot be undone.</>}
        isDeleting={isBulkDeleting}
        onCancel={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        confirmLabel={`Delete ${selectedCount}`}
      />
    </div>
  );
}
