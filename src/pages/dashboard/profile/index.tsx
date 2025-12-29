"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import Head from "next/head";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { LoadingSpinner } from "@/components/ui/loading";

interface CompanyInfo {
  id: string;
  name: string;
  owner_email?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Fetch company info using useCachedFetch
  const { data: companyData, isLoading, error: fetchError } = useCachedFetch<{
    exists: boolean;
    companies: Array<{
      id?: string;
      company_id?: string;
      name: string;
      owner_email?: string;
      created_at?: string;
    }>;
  }>(
    ['companyInfo', user?.id || ''],
    user ? `/api/company/check?owner_id=${user.id}` : '',
    { enabled: Boolean(user && isLoaded) }
  );

  // Process company data
  const companyInfo = useMemo(() => {
    if (!companyData?.exists || !companyData.companies?.length) {
      setError('No company found for this user');
      return null;
    }
    
    const company = companyData.companies[0];
    return {
      id: company.id || company.company_id || '',
      name: company.name || 'Unnamed Company',
      owner_email: company.owner_email || user?.emailAddresses?.[0]?.emailAddress || (user?.emailAddresses?.[0]?.emailAddress as string) || '',
      created_at: company.created_at || new Date().toISOString()
    };
  }, [companyData, user]);

  // Handle errors
  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching company info:', fetchError);
      setError(fetchError.message || 'Failed to load company information');
    } else if (companyData && !companyData.exists) {
      setError('No company found for this user');
    } else {
      setError(null);
    }
  }, [fetchError, companyData]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/signin");
    }
  }, [isLoaded, user, router]);

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6">
                <LoadingSpinner text="Loading your profile..." />
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  return (
    <DashboardAccess>
      <Head>
        <title>Profile | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />

        <meta
          name="description"
          content="Manage your profile details and account information."
        />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            {/* Sidebar - no border here since sidebar handles its own border */}
            <div className="bg-white">
              <DashboardSideBar />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
              <DashboardHeader
              />

              <main className="flex-1 p-6 space-y-6">
                <h1 className="text-2xl font-semibold">Profile</h1>

                {/* Profile Card */}
                <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md mx-auto flex flex-col items-center space-y-4">
                  <img
                    src={"https://github.com/shadcn.png"}
                    alt="Profile"
                    className="w-28 h-28 rounded-full border-2 border-white object-cover"
                  />
                  <h2 className="text-xl font-semibold">
                    {companyInfo?.name || 'No Company'}
                  </h2>

                  {/* Additional Info */}
                  <div className="w-full mt-4 space-y-2">
                   
                    <div className="flex justify-between border-b border-white/20 pb-2">
                      <span className="text-white/50">Joined:</span>
                      <span>
                        {new Date(
                          companyInfo?.created_at || Date.now()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/20 pb-2">
                      <span className="text-white/50">Owner Email:</span>
                      <span>
                        {companyInfo?.owner_email}
                      </span>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">
                Redirecting to sign in...
              </h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        </SignedOut>
      </div>
    </DashboardAccess>
  );
}