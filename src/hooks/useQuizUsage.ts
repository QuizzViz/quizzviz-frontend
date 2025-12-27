import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";

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

export function useQuizUsage(p0?: { refetchOnMount: string; refetchOnWindowFocus: boolean; }) {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [errorShown, setErrorShown] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  const plan = (user?.publicMetadata?.plan as string) || 'Free';
  
  // Fetch company info on mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!isLoaded || !user) {
        setIsLoadingCompany(false);
        return;
      }
      
      try {
        console.log('Fetching company info for user:', user.id);
        const response = await fetch(`/api/company/check?owner_id=${user.id}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Company check failed:', response.status, errorText);
          throw new Error(`Failed to fetch company information: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Company check response:', data);
        
        if (data.exists && data.companies && data.companies.length > 0) {
          const company = data.companies[0];
          console.log('Using company:', company);
          
          setCompanyInfo({
            id: company.company_id || company.id || company.name,
            name: company.name || company.company_id || 'Company',
            owner_email: company.owner_email || user?.emailAddresses?.[0]?.emailAddress
          });
        } else {
          console.warn('No company found for user');
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    };
    
    fetchCompanyInfo();
  }, [isLoaded, user]);

  const query = useQuery<QuizUsageData, Error>({
    queryKey: ['quiz-usage', companyInfo?.id, plan],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      if (!companyInfo?.id) throw new Error('Company information not available');
      
      const response = await fetch(`/api/quiz-usage?company_id=${encodeURIComponent(companyInfo.id)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch quiz usage');
      }

      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!user?.id && !isLoadingCompany,
  });

  // Handle errors with toast in a separate effect
  useEffect(() => {
    if (query.isError && !errorShown) {
      toast({
        title: 'Error',
        description: query.error?.message || 'Failed to fetch quiz usage',
        variant: 'destructive',
      });
      setErrorShown(true);
    }
  }, [query.isError, query.error, toast, errorShown]);

  return {
    ...query,
    companyInfo,
    isLoadingCompany
  };
}

interface PlanDetails {
  next: string;
  max: number;
  custom?: boolean;
}

type PlanType = 'Free' | 'Consumer' | 'Elite' | 'Business';

export function getUpgradeMessage(
  currentPlan: string, 
  currentUsage: number, 
  maxQuizzes: number
): { message: string; upgradePlan: string; showUpgrade: boolean } {
  const plans: Record<PlanType, PlanDetails> = {
    Free: { next: 'Consumer', max: 2 },
    Consumer: { next: 'Elite', max: 10 },
    Elite: { next: 'Business', max: 30 },
    Business: { next: 'Enterprise', max: 30, custom: true },
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