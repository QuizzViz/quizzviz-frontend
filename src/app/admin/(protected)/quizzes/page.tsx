'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2, Users, ChevronRight, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

type StatusFilter = 'all' | 'draft' | 'published';

interface QuizRow {
  quiz_id: string;
  company_id: string;
  company_name: string | null;
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
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<QuizRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/quizzes');
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: quizzes.length,
    draft: quizzes.filter((q) => !q.quiz_public_link).length,
    published: quizzes.filter((q) => !!q.quiz_public_link).length,
  }), [quizzes]);

  const visibleQuizzes = useMemo(() => {
    if (statusFilter === 'draft') return quizzes.filter((q) => !q.quiz_public_link);
    if (statusFilter === 'published') return quizzes.filter((q) => !!q.quiz_public_link);
    return quizzes;
  }, [quizzes, statusFilter]);

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
        load();
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
        <Link
          href="/admin/quizzes/new"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          <Plus className="h-4 w-4" /> New Quiz
        </Link>
      </div>
      <p className="text-sm text-zinc-500 mb-5">{visibleQuizzes.length} of {quizzes.length} quizzes shown (most recent 300) — click a row to view its questions</p>

      <div className="flex items-center gap-1.5 mb-5 border border-zinc-800 rounded-lg p-1 w-fit bg-zinc-950">
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

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Experience</th>
              <th className="text-left px-4 py-3 font-medium">Questions</th>
              <th className="text-left px-4 py-3 font-medium">Attempts</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : visibleQuizzes.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-500">No quizzes found</td></tr>
            ) : visibleQuizzes.map((q) => (
              <tr key={q.quiz_id} className="hover:bg-zinc-900/60 relative">
                <td className="px-4 py-3 text-white">
                  <Link href={`/admin/quizzes/${encodeURIComponent(q.quiz_id)}`} className="absolute inset-0 z-10" aria-label={`View ${q.role} quiz`} />
                  <span className="relative">{q.role}</span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{q.company_name || q.company_id}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-full px-2 py-0.5 border ${q.quiz_type === 'non_technical' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
                    {q.quiz_type === 'non_technical' ? 'Non-Technical' : 'Technical'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{q.experience}</td>
                <td className="px-4 py-3 text-zinc-400">{q.num_questions}</td>
                <td className="px-4 py-3 text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {q.attempt_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {q.quiz_public_link ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-green-500/15 text-green-300 border border-green-500/30">Published</span>
                  ) : (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">Draft</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right relative z-20">
                  <button onClick={() => setDeleteTarget(q)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete this quiz?"
        description={<>This removes <span className="text-white font-medium">&quot;{deleteTarget?.role}&quot;</span> from generated and published quizzes{deleteTarget?.attempt_count ? <> — <span className="text-orange-300">{deleteTarget.attempt_count} candidate attempt(s) already exist for it</span></> : null}. This cannot be undone.</>}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
