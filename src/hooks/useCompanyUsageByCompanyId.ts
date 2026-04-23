import { useToast } from '@/hooks/use-toast';
import { useCachedFetch } from './useCachedFetch';

type ApiError = Error & {
  status?: number;
  response?: {
    status?: number;
    data?: any;
  };
};

export interface CompanyUsageData {
  company_id: string;
  current_month: {
    unique_candidates: number;
    total_attempts: number;
  };
  previous_month: {
    unique_candidates: number;
    total_attempts: number;
  };
  all_months: Array<{
    year: number;
    month: number;
    unique_candidates: number;
    total_attempts: number;
  }>;
}

/**
 * Fetches company usage data by companyId without requiring user authentication.
 * This is designed for external candidate quiz attempts where no user is logged in.
 */
export function useCompanyUsageByCompanyId(companyId: string) {
  const { toast } = useToast();

  // Fetch company usage data using useCachedFetch
  const { 
    data, 
    isLoading: isLoadingUsage, 
    error: usageError, 
    refetch 
  } = useCachedFetch<CompanyUsageData>(
    ['companyUsageByCompanyId', companyId || ''],
    companyId ? `/api/quiz_result/usage?company_id=${encodeURIComponent(companyId)}` : '',
    { 
      enabled: Boolean(companyId)
    }
  );

  // Return empty data structure when no data is available
  const normalizedData = data || {
    company_id: companyId || '',
    current_month: {
      unique_candidates: 0,
      total_attempts: 0
    },
    previous_month: {
      unique_candidates: 0,
      total_attempts: 0
    },
    all_months: []
  };

  // Check if error is 404
  const is404Error = (error: unknown): boolean => {
    if (!error) return false;
    const apiError = error as ApiError;
    return apiError.status === 404 || apiError.response?.status === 404;
  };

  return {
    data: normalizedData,
    isLoading: isLoadingUsage,
    error: !is404Error(usageError) ? usageError : null, // Don't treat 404 as error
    refetch
  };
}
