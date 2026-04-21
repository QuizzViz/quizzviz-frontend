import { useToast } from '@/hooks/use-toast';
import { useUser } from "@clerk/nextjs";
import { useCachedFetch } from './useCachedFetch';
import { useState, useEffect } from 'react';
import { useCompanyInfo } from './useCompanyInfo';

type ApiError = Error & {
  status?: number;
  response?: {
    status?: number;
    data?: any;
  };
};

export interface QuizUsageData {
  user_id: string;
  current_month: {
    year: number;
    month: number;
    month_name: string;
    quiz_count: number;
    period: string;
  };
  quiz_count: number;
  monthly_breakdown: Array<{
    year: number;
    month: number;
    month_name: string;
    quiz_count: number;
    period: string;
  }>;
  total_quizzes: number;
}

interface CompanyInfo {
  id: string;
  name: string;
  owner_email?: string;
}

export function useQuizUsage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [errorShown, setErrorShown] = useState(false);
  
  const plan = (user?.publicMetadata?.plan as string) || 'Free';
  
  // Use the same logic as profile page
  const { companyInfo, isLoading: isCompanyLoading, error: companyError } = useCompanyInfo();
  
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

  // Fetch quiz usage data using useCachedFetch
  const companyId = companyInfo?.id || '';
  const { 
    data, 
    isLoading: isLoadingUsage, 
    error: usageError, 
    refetch 
  } = useCachedFetch<QuizUsageData>(
    ['quizUsage', companyId.toString()], // Ensure query key is always a string
    companyId ? `/api/quiz-usage?company_id=${encodeURIComponent(companyId)}` : '',
    { 
      enabled: Boolean(companyId)
    }
  );

  // Return empty data structure when no data is available
  const currentDate = new Date();
  const normalizedData = data || {
    user_id: user?.id || '',
    current_month: {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
      month_name: currentDate.toLocaleString('default', { month: 'long' }),
      quiz_count: 0,
      period: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    },
    quiz_count: 0,
    monthly_breakdown: [],
    total_quizzes: 0
  };

  // Check if error is 404
  const is404Error = (error: unknown): boolean => {
    if (!error) return false;
    const apiError = error as ApiError;
    return apiError.status === 404 || apiError.response?.status === 404;
  };
// Handle usage fetch errors
// useEffect(() => {
//   if (usageError && !errorShown) {
//     const apiError = usageError as ApiError;
//     console.error('Error fetching quiz usage:', apiError);
//     // Don't show error toast for 404 - just show empty state
//     if (apiError?.status !== 404 && apiError?.response?.status !== 404) {
//       toast({
//         title: 'Error',
//         description: 'Failed to load quiz usage data',
//         variant: 'destructive',
//       });
//       setErrorShown(true);
//     }
//   }
// }, [usageError, toast, errorShown]);

  return {
    data: normalizedData,
    isLoading: isLoadingUsage || isCompanyLoading,
    error: companyError || (!is404Error(usageError) ? usageError : null), // Don't treat 404 as error
    refetch,
    companyInfo,
    isCompanyLoading
  };
}

interface PlanDetails {
  next: string;
  max: number;
  custom?: boolean;
}

type PlanType = 'Free' | 'Growth' | 'Scale' | 'Enterprise';

export function getUpgradeMessage(
  currentPlan: string, 
  currentUsage: number, 
  maxQuizzes: number
): { message: string; upgradePlan: string; showUpgrade: boolean } {
  const plans: Record<PlanType, PlanDetails> = {
    Free: { next: 'Growth', max: 4 },
    Growth: { next: 'Scale', max: 30 },
    Scale: { next: 'Enterprise', max: 70 },
    Enterprise: { next: 'Enterprise', max: -1, custom: true }, // Unlimited
  };

  const plan = currentPlan as PlanType;
  const planData = plans[plan] || { next: 'Enterprise', max: 0 };
  
  // If current usage is at or exceeds the plan's max
  if (currentUsage >= planData.max) {
    if ('custom' in planData && planData.custom) {
      return {
        message: 'You have reached your monthly quiz generation limit. Contact us for custom plans.',
        upgradePlan: 'Enterprise',
        showUpgrade: true,
      };
    }
    return {
      message: `You have reached your ${currentPlan} plan monthly limit.`,
      upgradePlan: planData.next,
      showUpgrade: true,
    };
  }

  // If current usage is getting close to the limit (within 80%)
  if (currentUsage >= planData.max * 0.8) {
    return {
      message: `You have reached your monthly quiz generation limit.`,
      upgradePlan: planData.next,
      showUpgrade: true,
    };
  }

  // Default return when no restrictions or warnings needed
  return {
    message: `You have reached your monthly quiz generation limit.`,
    upgradePlan: '',
    showUpgrade: false,
  };
}