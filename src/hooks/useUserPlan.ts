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
  const { user, isLoaded: isUserLoaded } = useUser();
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
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });

  // React Query reports isLoading: false for a query that's still
  // enabled: false (e.g. before Clerk has resolved the signed-in user),
  // since it has never started fetching — that's a "not loading" signal,
  // not "we know the real plan". Treat "Clerk hasn't loaded" or "we have
  // a user id but no plan data yet" as loading too, so callers never
  // mistake this brief window for a resolved Free plan.
  const isLoading = !isUserLoaded || (!!user?.id && !query.isFetched && !query.data);

  // Function to invalidate user plan cache
  const invalidateUserPlan = () => {
    queryClient.invalidateQueries({ queryKey: ['userPlan', user?.id] });
  };

  return {
    ...query,
    isLoading,
    invalidateUserPlan,
    refetch: query.refetch,
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
