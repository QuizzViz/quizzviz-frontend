'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, Users, BarChart3, FileQuestion, ClipboardList, LogOut, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Companies & Billing', icon: Building2 },
  { href: '/admin/usage', label: 'Usage', icon: Gauge },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Growth Analytics', icon: BarChart3 },
  { href: '/admin/quizzes', label: 'Quizzes', icon: FileQuestion },
  { href: '/admin/results', label: 'Attempts / Results', icon: ClipboardList },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-800">
        <Link href="/admin" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image
              src="/QuizzViz-logo.png"
              alt="QuizzViz Logo"
              fill
              className="object-contain"
              priority
              sizes="2rem"
            />
          </div>
          <span className="text-base font-semibold text-white whitespace-nowrap">QuizzViz</span>
        </Link>
        <div className="text-xs text-zinc-500 mt-1">Internal admin panel</div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-gradient-to-r from-green-600/20 to-blue-600/20 text-white border border-green-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
