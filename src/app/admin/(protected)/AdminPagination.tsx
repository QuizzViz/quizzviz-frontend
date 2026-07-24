'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ADMIN_PAGE_SIZE = 100;

export function AdminPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Prev
      </button>
      <span className="text-sm text-zinc-500">Page {page} of {pageCount}</span>
      <button
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default AdminPagination;
