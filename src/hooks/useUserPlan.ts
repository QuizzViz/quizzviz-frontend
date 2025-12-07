import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

export type PlanType = 'Free' | 'Consumer' | 'Elite' | 'Business';

export interface UserPlanResponse {
  plan_name: 'Free' | 'Consumer' | 'Elite' | 'Business';
}

const fetchUserPlan = async (userId: string | null | undefined, getToken: () => Promise<string | null>): Promise<UserPlanResponse> => {
  if (!userId) throw new Error('User not authenticated');
  
  const token = await getToken();
  if (!token) throw new Error('No auth token');

  const response = await fetch(`/api/user_plan/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log('Failed to fetch user plan, defaulting to Business for testing');
    return { plan_name: 'Business' };
  }

  return response.json();
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

// Update user plan
export const updateUserPlan = async (
  userId: string,
  planName: PlanType,
  getToken: () => Promise<string | null>
): Promise<UserPlanResponse> => {
  if (!userId || !planName) throw new Error('User ID and plan name are required');
  
  const token = await getToken();
  if (!token) throw new Error('No auth token');

  const response = await fetch(`/api/user_plan/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ plan_name: planName }),
  });

  if (!response.ok) {
    throw new Error('Failed to update user plan');
  }

  return response.json();
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
