import { useToast } from '@/hooks/use-toast';
import { useUser } from "@clerk/nextjs";
import { useCachedFetch } from './useCachedFetch';
import { useState, useEffect } from 'react';

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

interface CompanyInfo {
  id: string;
  name: string;
  owner_email?: string;
}

export function useCompanyUsage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [errorShown, setErrorShown] = useState(false);
  
  // Fetch company info using useCachedFetch
  const { data: companyData, isLoading: isCompanyLoading, error: companyError } = useCachedFetch<{
    exists: boolean;
    companies: Array<{ id?: string; company_id?: string; name: string; owner_email?: string }>;
  }>(
    ['companyInfo', user?.id || ''],
    user && isLoaded ? `/api/company/check?owner_id=${user.id}` : '',
    { enabled: Boolean(user && isLoaded) }
  );
  
  // Process company info
  const companyInfo = companyData?.exists && companyData.companies?.[0] ? {
    id: companyData.companies[0].company_id || companyData.companies[0].id || '',
    name: companyData.companies[0].name || 'Unnamed Company',
    owner_email: companyData.companies[0].owner_email,
  } : null;
  
  // Handle company fetch errors
  useEffect(() => {
    if (companyError && !errorShown) {
      console.error('Error fetching company info:', companyError);
      toast({
        title: 'Error',
        description: 'Failed to load company information',
        variant: 'destructive',
      });
      setErrorShown(true);
    }
  }, [companyError, toast, errorShown]);

  // Fetch company usage data using useCachedFetch
  const companyId = companyInfo?.id;
  const { 
    data, 
    isLoading: isLoadingUsage, 
    error: usageError, 
    refetch 
  } = useCachedFetch<CompanyUsageData>(
    ['companyUsage', companyId || ''],
    companyId ? `/api/quiz_result/usage` : '',
    { 
      enabled: Boolean(companyId)
    }
  );

  // Return empty data structure when no data is available
  const currentDate = new Date();
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
    isLoading: isLoadingUsage || isCompanyLoading,
    error: companyError || (!is404Error(usageError) ? usageError : null), // Don't treat 404 as error
    refetch,
    companyInfo,
    isCompanyLoading
  };
}
