import Link from 'next/link';
import { AlertTriangle, AlertOctagon, Lock } from 'lucide-react';
import { usePlanExpiration } from '@/hooks/usePlanExpiration';
import { cn } from '@/lib/utils';

const SEVERITY_STYLES = {
  yellow: {
    wrap: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-200',
    icon: AlertTriangle,
    iconClass: 'text-yellow-400',
  },
  orange: {
    wrap: 'bg-orange-500/10 border-orange-500/40 text-orange-200',
    icon: AlertTriangle,
    iconClass: 'text-orange-400',
  },
  red: {
    wrap: 'bg-red-500/10 border-red-500/40 text-red-200',
    icon: AlertOctagon,
    iconClass: 'text-red-400',
  },
  expired: {
    wrap: 'bg-red-700/20 border-red-600/50 text-red-100',
    icon: Lock,
    iconClass: 'text-red-400',
  },
} as const;

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function PlanExpirationBanner() {
  const { severity, daysLeft, expiryDate, isLoading, planName } = usePlanExpiration();

  if (isLoading || severity === 'none' || !expiryDate) return null;

  const style = SEVERITY_STYLES[severity];
  const Icon = style.icon;
  const dateStr = formatDate(expiryDate);

  let message: string;
  if (severity === 'expired') {
    message = `Your ${planName} plan expired on ${dateStr}. You can still view your data, but creating, publishing, or editing anything is disabled until you renew.`;
  } else if (daysLeft === 0) {
    message = `Your ${planName} plan ends today (${dateStr}).`;
  } else if (daysLeft === 1) {
    message = `Your ${planName} plan ends tomorrow (${dateStr}).`;
  } else {
    message = `Your ${planName} plan ends in ${daysLeft} days (${dateStr}).`;
  }

  return (
    <div className={cn('flex items-center justify-between gap-3 border-b px-6 py-3 text-sm', style.wrap)}>
      <div className="flex items-center gap-2.5">
        <Icon className={cn('h-4 w-4 flex-shrink-0', style.iconClass)} />
        <span>{message}</span>
      </div>
      <Link
        href="/pricing"
        className="flex-shrink-0 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
      >
        {severity === 'expired' ? 'Renew Now' : 'Manage Plan'}
      </Link>
    </div>
  );
}

export default PlanExpirationBanner;
