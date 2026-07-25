'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Users2 } from 'lucide-react';
import { useAdminData } from '../useAdminData';
import { AdminPageLoading, AdminErrorState } from '../AdminPageLoading';
import { AdminRefreshButton } from '../AdminRefreshButton';
import { AdminPagination, ADMIN_PAGE_SIZE } from '../AdminPagination';

interface CompanyTeamRow {
  company_id: string;
  name: string;
  owner_email: string;
  plan_name: string;
  member_count: number;
}

export default function AdminTeamsPage() {
  const router = useRouter();
  const { data, isLoading, isRefreshing, error, refresh, lastUpdated } = useAdminData<CompanyTeamRow[]>('admin-teams', async () => {
    const res = await fetch('/api/admin/teams');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to load teams (${res.status})`);
    }
    const json = await res.json();
    return json.companies || [];
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search]);

  const companies = data || [];
  const visibleCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.owner_email.toLowerCase().includes(q) ||
      c.company_id.toLowerCase().includes(q)
    );
  }, [companies, search]);

  const pageCount = Math.max(1, Math.ceil(visibleCompanies.length / ADMIN_PAGE_SIZE));
  const pagedCompanies = useMemo(
    () => visibleCompanies.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE),
    [visibleCompanies, page]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Teams</h1>
          <p className="text-sm text-zinc-500 mt-1">{visibleCompanies.length} of {companies.length} companies shown — click a row to view its team members</p>
        </div>
        <AdminRefreshButton onClick={refresh} isRefreshing={isRefreshing} lastUpdated={lastUpdated} />
      </div>

      {error && <div className="mb-5"><AdminErrorState message={error} onRetry={refresh} /></div>}

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company name, owner email, or company id..."
          className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Team Members</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={5} className="p-0"><AdminPageLoading /></td></tr>
            ) : visibleCompanies.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No companies found</td></tr>
            ) : pagedCompanies.map((c) => (
              <tr
                key={c.company_id}
                onClick={() => router.push(`/admin/teams/${encodeURIComponent(c.company_id)}`)}
                className="hover:bg-zinc-900/60 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.company_id}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{c.owner_email}</td>
                <td className="px-4 py-3 text-zinc-400">{c.plan_name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-zinc-300">
                    <Users2 className="h-3.5 w-3.5 text-zinc-500" /> {c.member_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-sm text-green-400">
                    View team <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
