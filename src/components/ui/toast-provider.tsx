'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster 
      position="top-center"
      theme="light"
      toastOptions={{
        duration: 5000,
        style: {
          background: 'hsl(0, 84%, 40%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        classNames: {
          toast: '!bg-red-600 !text-white !border-0',
          title: '!text-white',
          description: '!text-red-100',
          closeButton: '!text-white hover:!bg-red-700',
        },
      }}
    />
  );
}
