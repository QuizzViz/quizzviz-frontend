import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminSession';
import AdminNav from './AdminNav';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <AdminNav />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
