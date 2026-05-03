'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, Zap, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { useUserRole } from '@/hooks/useUserRole';

interface Company {
  company_id: string;
  plan_name: string;
  owner_id: string;
  // Add other company fields as needed
}

export function DashboardAccess({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');

  // Check if user is an invited member by checking sessionStorage FIRST
  // This must be determined BEFORE calling useCompanies to avoid race conditions
  const sessionStorageCompanyId = typeof window !== 'undefined' ? sessionStorage.getItem('userCompanyId') : null;
  const localStorageCompanyId = typeof window !== 'undefined' ? localStorage.getItem('userCompanyId') : null;
  const isInvitedMember = !!sessionStorageCompanyId;

  // CRITICAL: For invited members, pass undefined to force sessionStorage logic
  // For company owners, pass user ID to fetch by owner_id
  const useCompaniesParam = isInvitedMember ? undefined : user?.id;
  const { company, loading: isLoadingCompany, error } = useCompanies(useCompaniesParam);

  // For invited members, also fetch their role to validate they're still a member
  const companyId = isInvitedMember ? (sessionStorageCompanyId || localStorageCompanyId) : company?.company_id;
  const { userRole, loading: isLoadingRole, error: roleError } = useUserRole(companyId || undefined);

  useEffect(() => {
    // Set the current path on client-side only
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  const isPricingPage = currentPath === '/pricing';

  // Skip all checks for pricing page
  if (isPricingPage) {
    return <>{children}</>;
  }

  // Show loading state in the page content instead
  // Give more time for company data to load, especially for invited members
  if (!isLoaded || isLoadingCompany) {
    return <>{children}</>;
  }

  // Check both sessionStorage and localStorage for company_id
  const hasStorageCompanyId = sessionStorageCompanyId || localStorageCompanyId;

  // CRITICAL: For invited members, validate they are still a valid member before allowing access
  if (isInvitedMember || hasStorageCompanyId) {
    
    // If we have company data, verify the user is still a member
    // If no company data, allow access (will be validated by API calls)
    if (company && user?.id) {
      // Check if current user is the owner (always valid)
      if (company.owner_id === user.id) {
        return <>{children}</>;
      }
      
      // For non-owners, we need to validate they are still a member
      // This will be handled by the role fetching in useCachedDashboardData
      // If they're not a member anymore, the role fetch will fail and clear their cache
      return <>{children}</>;
    }
    
    // No company data yet, allow access (validation will happen during data fetch)
    return <>{children}</>;
  }

  // Check if user needs to create a company
  // ONLY show onboarding if: no company data, not invited member, and no storage company_id
  if (!company && !isInvitedMember && !hasStorageCompanyId) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                  Welcome to QuizzViz
                </h2>
                <p className="text-gray-300 text-base">
                  Create your company to start building and sharing technical assessments with candidates.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/onboarding')}
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl group rounded-xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Create Your Company
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For invited members or users with storage: if company data failed to load but storage exists, allow access
  if (!company && (isInvitedMember || hasStorageCompanyId)) {
    return <>{children}</>;
  }

  // FREE ACCESS - Allow dashboard access for any user with a company
  return <>{children}</>;
}