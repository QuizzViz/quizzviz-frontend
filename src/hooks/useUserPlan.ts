import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

export type PlanType = 'Free' | 'Consumer' | 'Elite' | 'Business';

export interface UserPlanResponse {
  plan_name: 'Free' | 'Consumer' | 'Elite' | 'Business';
}

export interface CompanyResponse {
  id: string;
  name: string;
  plan_name: 'Free' | 'Consumer' | 'Elite' | 'Business';
  company_size: string;
  owner_id: string;
  owner_email: string;
  company_id: string;
}

const fetchUserPlan = async (userId: string | null | undefined, getToken: () => Promise<string | null>): Promise<UserPlanResponse> => {
  if (!userId) throw new Error('User not authenticated');
  
  const token = await getToken();
  if (!token) throw new Error('No auth token');

  const response = await fetch(`/api/company/check?owner_id=${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log('Failed to fetch company, defaulting to Free plan');
    return { plan_name: 'Free' };
  }

  const data = await response.json();
  
  // If user has a company, return its plan_name, otherwise default to Free
  if (data.exists && data.companies && data.companies.length > 0) {
    return { plan_name: data.companies[0].plan_name || 'Free' };
  }
  
  return { plan_name: 'Free' };
};

export const useUserPlan = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const fetchPlan = async () => {
    if (!user?.id) throw new Error('No user ID');
    const token = await getToken();
    return fetchUserPlan(user.id, () => Promise.resolve(token));
  };

  return useQuery<UserPlanResponse, Error>({
    queryKey: ['userPlan', user?.id],
    queryFn: fetchPlan,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  });
};


// Utility function to check plan features
export const hasFeatureAccess = (
  userPlan: PlanType, 
  requiredPlan: PlanType,
  planOrder: PlanType[] = ['Free', 'Consumer', 'Elite', 'Business']
): boolean => {
  if (!userPlan) return false;
  if (userPlan === requiredPlan) return true;
  
  const userPlanIndex = planOrder.indexOf(userPlan);
  const requiredPlanIndex = planOrder.indexOf(requiredPlan);
  
  return userPlanIndex >= requiredPlanIndex && userPlanIndex !== -1 && requiredPlanIndex !== -1;
};
