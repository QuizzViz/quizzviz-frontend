'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gauge } from 'lucide-react';

interface UsageRow {
  company_id: string;
  name: string;
  plan_name: string;
  billing_cycle: string;
  period_start: string;
  period_end: string;
  quizzes_used: number;
  quizzes_limit: number;
  quizzes_pct: number;
  candidates_used: number;
  candidates_limit: number;
  candidates_pct: number;
}

function barColor(pct: number) {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

function UsageBar({ used, limit, pct }: { used: number; limit: number; pct: number }) {
  const unlimited = limit === -1;
  return (
    <div className="w-40">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-zinc-400">{used} / {unlimited ? '∞' : limit}</span>
        <span className={pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : 'text-zinc-500'}>
          {unlimited ? '—' : `${pct}%`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div className={`h-full rounded-full ${barColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function AdminUsagePage() {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/usage');
        const data = await res.json();
        setUsage(data.usage || []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <Gauge className="h-5 w-5 text-green-400" />
        <h1 className="text-2xl font-semibold text-white">Usage</h1>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        How much of each company&apos;s current billing period quota has been used — anchored to their actual subscription
        cycle, not the calendar month.
      </p>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Current period</th>
              <th className="text-left px-4 py-3 font-medium">Quizzes used</th>
              <th className="text-left px-4 py-3 font-medium">Candidates used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : usage.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No companies found</td></tr>
            ) : usage.map((u) => (
              <tr key={u.company_id} className="hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/companies/${encodeURIComponent(u.company_id)}`} className="text-white hover:text-green-400 font-medium">
                    {u.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400">{u.plan_name}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {u.period_start} → {u.period_end}
                  <div className="text-zinc-600 capitalize">{u.billing_cycle.replace('_', '-')}</div>
                </td>
                <td className="px-4 py-3"><UsageBar used={u.quizzes_used} limit={u.quizzes_limit} pct={u.quizzes_pct} /></td>
                <td className="px-4 py-3"><UsageBar used={u.candidates_used} limit={u.candidates_limit} pct={u.candidates_pct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
