import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type PlanType = 'Free' | 'Growth' | 'Scale' | 'Enterprise';

export interface UserPlanResponse {
  plan_name: 'Free' | 'Growth' | 'Scale' | 'Enterprise';
}

export interface CompanyResponse {
  id: string;
  name: string;
  plan_name: 'Free' | 'Growth' | 'Scale' | 'Enterprise';
  company_size: string;
  owner_id: string;
  owner_email: string;
  company_id: string;
}

const fetchUserPlan = async (userId: string | null | undefined, getToken: () => Promise<string | null>): Promise<UserPlanResponse> => {
  if (!userId) throw new Error('User not authenticated');
  
  const token = await getToken();
  if (!token) throw new Error('No auth token');

  // Check if user is a member with stored company_id
  let fetchUrl = `/api/company/check?owner_id=${userId}`;
  let companyId: string | null = null;

  if (typeof window !== 'undefined') {
    // Try to get company_id from storage for member users
    companyId = localStorage.getItem('userCompanyId') || 
                sessionStorage.getItem('userCompanyId') ||
                (typeof window !== 'undefined' && (window as any).user?.unsafeMetadata?.companyId);
    
    if (companyId) {
      fetchUrl = `/api/company/${companyId}`;
    }
  }

  const response = await fetch(fetchUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log('Failed to fetch company, defaulting to Free plan');
    return { plan_name: 'Free' };
  }

  const data = await response.json();
  
  // Handle both response formats: array from check endpoint and object from direct company endpoint
  let companyData;
  if (data.companies && data.companies.length > 0) {
    companyData = data.companies[0];
  } else if (data.company_id || data.name) {
    companyData = data;
  }
  
  // If user has a company, return its plan_name, otherwise default to Free
  if (companyData) {
    return { plan_name: companyData.plan_name || 'Free' };
  }
  
  return { plan_name: 'Free' };
};

export const useUserPlan = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  const fetchPlan = async () => {
    if (!user?.id) throw new Error('No user ID');
    const token = await getToken();
    return fetchUserPlan(user.id, () => Promise.resolve(token));
  };

  const query = useQuery<UserPlanResponse, Error>({
    queryKey: ['userPlan', user?.id],
    queryFn: fetchPlan,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });

  // Function to invalidate user plan cache
  const invalidateUserPlan = () => {
    queryClient.invalidateQueries({ queryKey: ['userPlan', user?.id] });
  };

  return {
    ...query,
    invalidateUserPlan,
  };
};


// Utility function to check plan features
export const hasFeatureAccess = (
  userPlan: PlanType, 
  requiredPlan: PlanType,
  planOrder: PlanType[] = ['Free', 'Growth', 'Scale', 'Enterprise']
): boolean => {
  if (!userPlan) return false;
  if (userPlan === requiredPlan) return true;
  
  const userPlanIndex = planOrder.indexOf(userPlan);
  const requiredPlanIndex = planOrder.indexOf(requiredPlan);
  
  return userPlanIndex >= requiredPlanIndex && userPlanIndex !== -1 && requiredPlanIndex !== -1;
};
