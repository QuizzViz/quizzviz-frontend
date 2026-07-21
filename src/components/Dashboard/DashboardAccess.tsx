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

  // Resolve a known company_id from every source we have. Clerk metadata is
  // the authoritative, cross-session source for BOTH owners (set on company
  // creation) and invited members (set on invite acceptance), so it takes
  // priority over the sessionStorage/localStorage caches, which can be empty
  // on a fresh session even though the user genuinely belongs to a company.
  const metadataCompanyId = user?.unsafeMetadata?.companyId as string | undefined;
  const sessionStorageCompanyId = typeof window !== 'undefined' ? sessionStorage.getItem('userCompanyId') : null;
  const localStorageCompanyId = typeof window !== 'undefined' ? localStorage.getItem('userCompanyId') : null;
  const knownCompanyId = metadataCompanyId || sessionStorageCompanyId || localStorageCompanyId || undefined;

  // Validate the user against the company via the company-members service
  // (role/membership check) rather than the owner-only /api/company/check
  // endpoint. This works uniformly for OWNER, ADMIN, and MEMBER roles.
  const { userRole, loading: isLoadingRole } = useUserRole(knownCompanyId);

  // Fallback only: used when we have no company_id from any source, to tell
  // apart a genuinely new user (needs onboarding) from a member whose
  // metadata/storage hasn't been populated yet.
  const { company, loading: isLoadingCompany } = useCompanies(knownCompanyId ? undefined : user?.id);

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

  if (!isLoaded) {
    return <>{children}</>;
  }

  // We have a company_id from metadata/storage - gate on membership + role
  // rather than ownership. useUserRole already handles: member found (any
  // role) -> access granted; member deleted -> signs the user out; owner
  // without a member record yet -> auto-provisions the OWNER record.
  if (knownCompanyId) {
    if (isLoadingRole) {
      return <>{children}</>;
    }

    // Role resolved - user is a confirmed member (OWNER/ADMIN/MEMBER).
    if (userRole) {
      return <>{children}</>;
    }

    // Role lookup failed for a reason other than deletion (e.g. transient
    // service error). Don't block access here - let the page-level data
    // fetches surface the error instead of misreporting "no company".
    return <>{children}</>;
  }

  // No company_id from metadata or storage - only now fall back to the
  // ownership check to confirm this is truly a brand new user.
  if (isLoadingCompany) {
    return <>{children}</>;
  }

  // Check if user needs to create a company
  if (!company) {
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

  // FREE ACCESS - Allow dashboard access for any user with a company
  return <>{children}</>;
}