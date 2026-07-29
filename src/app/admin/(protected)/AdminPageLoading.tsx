'use client';

export function AdminPageLoading({ text = 'Loading...', size = 'md' }: { text?: string; size?: 'sm' | 'md' }) {
  const ring = size === 'sm' ? 'w-8 h-8 border-2' : 'w-12 h-12 border-[3px]';
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <div className={`${ring} border-zinc-800 rounded-full`} />
          <div className={`${ring} border-transparent rounded-full border-t-green-400 border-r-blue-400 animate-spin absolute top-0 left-0`} />
        </div>
        <p className="text-sm bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-medium">
          {text}
        </p>
      </div>
    </div>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-6 text-center">
      <p className="text-sm text-red-300 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 px-4 py-1.5 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export default AdminPageLoading;
