import { useMemo } from 'react';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';

export type PlanExpirationSeverity = 'none' | 'yellow' | 'orange' | 'red' | 'expired';

export interface PlanExpirationStatus {
  isLoading: boolean;
  planName: string;
  expiryDate: Date | null;
  daysLeft: number | null;
  isExpired: boolean;
  severity: PlanExpirationSeverity;
}

// 7 days left -> yellow, 3 days left -> orange, 1 day left -> red, past the date -> expired.
export function usePlanExpiration(): PlanExpirationStatus {
  const { companyInfo, isLoading } = useCompanyInfo();

  return useMemo(() => {
    const planName = companyInfo?.plan_name || 'Free';
    const expiryStr = companyInfo?.plan_expiry_date;

    if (!expiryStr || planName === 'Free') {
      return { isLoading, planName, expiryDate: null, daysLeft: null, isExpired: false, severity: 'none' as const };
    }

    // Treat the expiry date as valid through the end of that day.
    const expiryDate = new Date(`${expiryStr}T23:59:59`);
    const now = new Date();
    const msLeft = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft < 0;

    let severity: PlanExpirationSeverity = 'none';
    if (isExpired) severity = 'expired';
    else if (daysLeft <= 1) severity = 'red';
    else if (daysLeft <= 3) severity = 'orange';
    else if (daysLeft <= 7) severity = 'yellow';

    return { isLoading, planName, expiryDate, daysLeft, isExpired, severity };
  }, [companyInfo, isLoading]);
}
