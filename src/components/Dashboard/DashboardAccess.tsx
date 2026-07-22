'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, Zap, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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
  const [isLeavingRemovedCompany, setIsLeavingRemovedCompany] = useState(false);
  const hasHandledRemoval = useRef(false);

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
  const { userRole, loading: isLoadingRole, errorStatus: roleErrorStatus } = useUserRole(knownCompanyId);

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

  // A definitive 404 (not a transient error — see the status check below) for
  // a companyId we ourselves resolved from metadata/storage means this user
  // no longer has a membership row for that company, i.e. they were removed.
  // Clear the stale association and send them to onboarding to create their
  // own company, instead of leaving them with indefinite access to a
  // dashboard they no longer belong to.
  useEffect(() => {
    if (hasHandledRemoval.current) return;
    if (!knownCompanyId || isLoadingRole || userRole || roleErrorStatus !== 404) return;

    hasHandledRemoval.current = true;
    setIsLeavingRemovedCompany(true);

    const cleanupAndRedirect = async () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('userCompanyId');
          sessionStorage.removeItem('company_id');
          localStorage.removeItem('userCompanyId');
          localStorage.removeItem('userCompanyName');
        }
        if (user) {
          const { companyId: _companyId, companyName: _companyName, ...rest } = (user.unsafeMetadata || {}) as Record<string, unknown>;
          await user.update({ unsafeMetadata: rest });
        }
      } catch (err) {
        console.error('Error cleaning up removed-member company data:', err);
      } finally {
        router.push('/onboarding');
      }
    };

    cleanupAndRedirect();
  }, [knownCompanyId, isLoadingRole, userRole, roleErrorStatus, user, router]);

  const isPricingPage = currentPath === '/pricing';

  // Skip all checks for pricing page
  if (isPricingPage) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return <>{children}</>;
  }

  if (isLeavingRemovedCompany) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // We have a company_id from metadata/storage - gate on membership + role
  // rather than ownership. useUserRole already handles: member found (any
  // role) -> access granted; owner without a member record yet ->
  // auto-provisions the OWNER record; a confirmed 404 (no membership row) ->
  // handled by the effect above, which clears the stale association and
  // redirects to onboarding.
  if (knownCompanyId) {
    if (isLoadingRole) {
      return <>{children}</>;
    }

    // Role resolved - user is a confirmed member (OWNER/ADMIN/MEMBER).
    if (userRole) {
      return <>{children}</>;
    }

    // Role lookup failed for a reason other than a confirmed 404 (e.g.
    // transient service error, 500/503). Don't block access here - let the
    // page-level data fetches surface the error instead of misreporting "no
    // company". A definitive 404 is handled by the effect above.
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