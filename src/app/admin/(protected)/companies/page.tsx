'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';

interface Company {
  company_id: string;
  name: string;
  plan_name: string;
  company_size: string;
  owner_email: string;
  billing_cycle: string;
  plan_start_date: string | null;
  plan_expiry_date: string | null;
  created_at: string;
}

function planBadgeClass(plan: string) {
  switch (plan) {
    case 'Enterprise': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'Scale': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'Growth': return 'bg-green-500/15 text-green-300 border-green-500/30';
    default: return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  }
}

function expiryStatus(expiry: string | null): { label: string; className: string } {
  if (!expiry) return { label: '—', className: 'text-zinc-500' };
  const days = Math.ceil((new Date(`${expiry}T23:59:59`).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `Expired ${expiry}`, className: 'text-red-400' };
  if (days <= 1) return { label: `${expiry} (${days}d)`, className: 'text-red-400' };
  if (days <= 3) return { label: `${expiry} (${days}d)`, className: 'text-orange-400' };
  if (days <= 7) return { label: `${expiry} (${days}d)`, className: 'text-yellow-400' };
  return { label: expiry, className: 'text-zinc-300' };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/companies${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const data = await res.json();
      setCompanies(data.companies || []);
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Companies & Billing</h1>
          <p className="text-sm text-zinc-500 mt-1">{companies.length} companies shown</p>
        </div>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or company id..."
          className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Billing Cycle</th>
              <th className="text-left px-4 py-3 font-medium">Renews / Expires</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Loading...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No companies found</td></tr>
            ) : companies.map((c) => {
              const status = expiryStatus(c.plan_expiry_date);
              return (
                <tr key={c.company_id} className="hover:bg-zinc-900/60">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.company_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${planBadgeClass(c.plan_name)}`}>
                      {c.plan_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 capitalize">{c.plan_name === 'Free' ? '—' : (c.billing_cycle || 'monthly').replace('_', '-')}</td>
                  <td className={`px-4 py-3 ${status.className}`}>{status.label}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.owner_email}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/companies/${encodeURIComponent(c.company_id)}`}
                      className="inline-flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
                    >
                      Manage <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
