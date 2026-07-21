'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface ResultRow {
  id: number;
  quiz_id: string;
  company_id: string;
  company_name: string | null;
  username: string;
  user_email: string;
  attempt: number;
  result: { score?: number; total_questions?: number };
  created_at: string;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/results');
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this specific attempt?')) return;
    await fetch(`/api/admin/results?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-1">Attempts / Results</h1>
      <p className="text-sm text-zinc-500 mb-6">{results.length} attempts shown (most recent 300)</p>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Candidate</th>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Attempt</th>
              <th className="text-left px-4 py-3 font-medium">Score</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : results.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No attempts found</td></tr>
            ) : results.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  <div className="text-white">{r.username}</div>
                  <div className="text-xs text-zinc-500">{r.user_email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{r.company_name || r.company_id}</td>
                <td className="px-4 py-3 text-zinc-400">#{r.attempt}</td>
                <td className="px-4 py-3 text-zinc-300">{r.result?.score !== undefined ? `${r.result.score}%` : '—'}</td>
                <td className="px-4 py-3 text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(r.id)} className="text-zinc-500 hover:text-red-400">
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
