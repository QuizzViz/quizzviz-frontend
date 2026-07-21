'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  isDeleting = false,
  onCancel,
  onConfirm,
  confirmLabel = 'Delete',
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-red-900/20 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white leading-tight">{title}</h3>
          </div>
          <button onClick={onCancel} disabled={isDeleting} className="text-zinc-500 hover:text-white flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm text-zinc-400 mb-6">{description}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium disabled:opacity-60 shadow-lg shadow-red-600/20 transition-all"
          >
            {isDeleting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
