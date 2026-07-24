'use client';

import Link from 'next/link';
import { Building2, FileQuestion, Send, ClipboardCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useAdminData } from './useAdminData';
import { AdminPageLoading, AdminErrorState } from './AdminPageLoading';

interface OverviewPayload {
  totals: any;
  recentCompanies: any[];
}

export default function AdminOverviewPage() {
  const { data, isLoading, isRefreshing, error, refresh } = useAdminData<OverviewPayload>('admin-overview', async () => {
    const [analyticsRes, companiesRes] = await Promise.all([
      fetch('/api/admin/analytics'),
      fetch('/api/admin/companies'),
    ]);
    if (!analyticsRes.ok || !companiesRes.ok) {
      throw new Error('Failed to load overview data');
    }
    const analytics = await analyticsRes.json();
    const companies = await companiesRes.json();
    return { totals: analytics.totals, recentCompanies: (companies.companies || []).slice(0, 8) };
  });

  const totals = data?.totals;
  const recentCompanies = data?.recentCompanies || [];

  const cards = [
    { label: 'Companies', value: totals?.total_companies, icon: Building2, href: '/admin/companies' },
    { label: 'Quizzes generated', value: totals?.total_quizzes_generated, icon: FileQuestion, href: '/admin/quizzes' },
    { label: 'Quizzes published', value: totals?.total_quizzes_published, icon: Send, href: '/admin/quizzes' },
    { label: 'Quiz attempts', value: totals?.total_attempts, icon: ClipboardCheck, href: '/admin/results' },
  ];

  if (isLoading) {
    return <AdminPageLoading text="Loading overview..." />;
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <AdminErrorState message={error} onRetry={refresh} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
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
