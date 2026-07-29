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

const fetchUserPlan = async (
  userId: string | null | undefined,
  getToken: () => Promise<string | null>,
  metadataCompanyId?: string | null
): Promise<UserPlanResponse> => {
  if (!userId) throw new Error('User not authenticated');

  const token = await getToken();
  if (!token) throw new Error('No auth token');

  // Resolve the caller's company_id the same way a member is actually
  // assigned one elsewhere in the app: Clerk metadata first (passed in from
  // the caller, since this standalone function has no access to the React
  // `user` object — the previous `window.user` fallback here never worked,
  // there is no such global), then whichever storage key holds it. Different
  // flows write different keys — accept-invite writes sessionStorage
  // "company_id" via storeCompanyId, while most of the rest of the app
  // reads/writes "userCompanyId" — so a freshly invited member whose
  // metadata hadn't synced yet would silently fall through to the
  // owner-only /company/check lookup and get "Free" forever, not just
  // during a brief loading window.
  let fetchUrl = `/api/company/check?owner_id=${userId}`;
  let companyId: string | null = metadataCompanyId || null;

  if (!companyId && typeof window !== 'undefined') {
    companyId = localStorage.getItem('userCompanyId') ||
                sessionStorage.getItem('userCompanyId') ||
                sessionStorage.getItem('company_id');
  }

  if (companyId) {
    fetchUrl = `/api/company/${companyId}`;
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
  const metadataCompanyId = (user?.unsafeMetadata?.companyId as string | undefined) || undefined;

  const fetchPlan = async () => {
    if (!user?.id) throw new Error('No user ID');
    const token = await getToken();
    return fetchUserPlan(user.id, () => Promise.resolve(token), metadataCompanyId);
  };

  const query = useQuery<UserPlanResponse, Error>({
    // Company assignment can change after this hook first mounts (e.g. a
    // freshly invited member whose Clerk metadata syncs a moment after
    // /dashboard loads) — keying on metadataCompanyId too means that once it
    // shows up, this refetches against the right company instead of serving
    // an already-cached "Free" result from before it was known.
    queryKey: ['userPlan', user?.id, metadataCompanyId || 'no-company'],
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
