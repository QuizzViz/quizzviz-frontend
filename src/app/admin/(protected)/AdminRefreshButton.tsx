'use client';

import { Loader2, RefreshCw } from 'lucide-react';

// Matches the Dashboard's Refresh button (src/pages/dashboard/analytics/index.tsx)
// exactly, so the admin panel and the customer-facing Dashboard feel like the
// same product wherever a "Refresh" control appears.
export function AdminRefreshButton({
  onClick,
  isRefreshing,
  lastUpdated,
}: {
  onClick: () => void;
  isRefreshing: boolean;
  lastUpdated?: number | null;
}) {
  return (
    <div className="flex items-center gap-4">
      {lastUpdated && (
        <div className="text-sm text-zinc-400">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
      <button
        onClick={onClick}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md h-10 px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50 disabled:pointer-events-none"
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </>
        )}
      </button>
    </div>
  );
}

export default AdminRefreshButton;
