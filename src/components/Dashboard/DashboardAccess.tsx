'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, Zap, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCompanies } from '@/hooks/useCompanies';

interface Company {
  company_id: string;
  plan_name: string;
  // Add other company fields as needed
}

export function DashboardAccess({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');

  // Check if user is an invited member by checking sessionStorage first
  // Do this immediately to avoid race conditions
  const isInvitedMember = typeof window !== 'undefined' ? !!sessionStorage.getItem('company_id') : false;

  // For invited members, use undefined to force sessionStorage logic
  // For company owners, use user ID
  const { company, loading: isLoadingCompany, error } = useCompanies(isInvitedMember ? undefined : user?.id);

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
  if (!isLoaded || isLoadingCompany) {
    return <>{children}</>;
  }

  // Check if user needs to create a company
  // BUT only show onboarding if NOT an invited member (no sessionStorage company_id)
  if (!company && !isInvitedMember) {
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

  // For invited members: if company data failed to load but sessionStorage exists, allow access
  if (!company && isInvitedMember) {
    console.log('Invited member: Company data failed to load but sessionStorage exists, allowing dashboard access');
    return <>{children}</>;
  }

  // FREE ACCESS - Allow dashboard access for any user with a company
  return <>{children}</>;
}