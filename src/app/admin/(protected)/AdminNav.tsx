'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Building2, BarChart3, FileQuestion, ClipboardList, LogOut, Gauge, Mail, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Companies & Billing', icon: Building2 },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/usage', label: 'Usage', icon: Gauge },
  { href: '/admin/analytics', label: 'Growth Analytics', icon: BarChart3 },
  { href: '/admin/quizzes', label: 'Quizzes', icon: FileQuestion },
  { href: '/admin/results', label: 'Attempts / Results', icon: ClipboardList },
  { href: '/admin/email', label: 'Email Customers', icon: Mail },
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
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-10 w-10 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
            <Image
              src="/QuizzViz-logo.png"
              alt="QuizzViz Logo"
              fill
              className="object-contain"
              priority
              sizes="2.5rem"
            />
          </div>
          <span className="text-xl font-semibold text-white whitespace-nowrap">QuizzViz</span>
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
                'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:scale-[1.02] active:scale-[0.98] will-change-transform',
                active ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
