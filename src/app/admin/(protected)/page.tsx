'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, FileQuestion, Send, ClipboardCheck, ArrowRight } from 'lucide-react';

export default function AdminOverviewPage() {
  const [totals, setTotals] = useState<any>(null);
  const [recentCompanies, setRecentCompanies] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [analyticsRes, companiesRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/companies'),
      ]);
      const analytics = await analyticsRes.json();
      const companies = await companiesRes.json();
      setTotals(analytics.totals);
      setRecentCompanies((companies.companies || []).slice(0, 8));
    })();
  }, []);

  const cards = [
    { label: 'Companies', value: totals?.total_companies, icon: Building2, href: '/admin/companies' },
    { label: 'Quizzes generated', value: totals?.total_quizzes_generated, icon: FileQuestion, href: '/admin/quizzes' },
    { label: 'Quizzes published', value: totals?.total_quizzes_published, icon: Send, href: '/admin/quizzes' },
    { label: 'Quiz attempts', value: totals?.total_attempts, icon: ClipboardCheck, href: '/admin/results' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-1">Overview</h1>
      <p className="text-sm text-zinc-500 mb-8">Welcome to the QuizzViz internal admin panel.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 w-fit mb-3">
              <Icon className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-semibold text-white">{value !== undefined ? Number(value).toLocaleString() : '—'}</div>
            <div className="text-sm text-zinc-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">Recently created companies</h2>
          <Link href="/admin/companies" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentCompanies.map((c) => (
            <Link
              key={c.company_id}
              href={`/admin/companies/${encodeURIComponent(c.company_id)}`}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-900 text-sm"
            >
              <div>
                <span className="text-white">{c.name}</span>
                <span className="text-zinc-500 ml-2">{c.owner_email}</span>
              </div>
              <span className="text-zinc-500">{new Date(c.created_at).toLocaleDateString()}</span>
            </Link>
          ))}
          {recentCompanies.length === 0 && <p className="text-zinc-500 text-sm">No companies yet.</p>}
        </div>
      </div>
    </div>
  );
}
