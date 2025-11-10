import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import {useUser} from "@clerk/nextjs";

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

export function useQuizUsage(p0?: { refetchOnMount: string; refetchOnWindowFocus: boolean; }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [errorShown, setErrorShown] = useState(false);

  const plan = (user?.publicMetadata?.plan as string) || 'Free';
  
  const query = useQuery<QuizUsageData, Error>({
    queryKey: ['quiz-usage', user?.id, plan],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      const response = await fetch(`/api/quiz-usage?userId=${encodeURIComponent(user.id)}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch quiz usage');
      }

      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!user?.id,
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

  return query;
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
