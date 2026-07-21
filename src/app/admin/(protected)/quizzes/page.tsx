'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

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
  created_at: string;
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDelete = async (quizId: string) => {
    if (!confirm('Delete this quiz? This removes it from generated and published quizzes.')) return;
    await fetch(`/api/admin/quizzes?quiz_id=${encodeURIComponent(quizId)}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-1">Quizzes</h1>
      <p className="text-sm text-zinc-500 mb-6">{quizzes.length} quizzes shown (most recent 300)</p>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Experience</th>
              <th className="text-left px-4 py-3 font-medium">Questions</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : quizzes.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No quizzes found</td></tr>
            ) : quizzes.map((q) => (
              <tr key={q.quiz_id} className="hover:bg-zinc-900/60">
                <td className="px-4 py-3 text-white">{q.role}</td>
                <td className="px-4 py-3 text-zinc-400">{q.company_name || q.company_id}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-full px-2 py-0.5 border ${q.quiz_type === 'non_technical' ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
                    {q.quiz_type === 'non_technical' ? 'Non-Technical' : 'Technical'}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{q.experience}</td>
                <td className="px-4 py-3 text-zinc-400">{q.num_questions}</td>
                <td className="px-4 py-3">
                  {q.quiz_public_link ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-green-500/15 text-green-300 border border-green-500/30">Published</span>
                  ) : (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">Draft</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(q.quiz_id)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
