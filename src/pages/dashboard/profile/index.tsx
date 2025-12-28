"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
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
  const [isLoading, setIsLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!isLoaded || !user) return;
      
      try {
        const response = await fetch(`/api/company/check?owner_id=${user.id}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Company check failed:', response.status, errorText);
          throw new Error(`Failed to fetch company information: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.exists && data.companies && data.companies.length > 0) {
          const company = data.companies[0];
          setCompanyInfo({
            id: company.id || company.company_id,
            name: company.name || 'Unnamed Company',
            owner_email: company.owner_email,
            created_at: company.created_at
          });
        } else {
          setCompanyInfo(null);
          setError('No company found for this user');
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        setError(error instanceof Error ? error.message : 'Failed to load company information');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isLoaded) {
      if (!user) {
        router.push("/signin");
      } else {
        fetchCompanyInfo();
      }
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
                <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md w-full mx-auto space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-1">
                      {companyInfo?.name || 'No Company'}
                    </h2>
                    <p className="text-white/70">
                      {companyInfo?.owner_email || 'No owner email'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-white/60">Company ID:</span>
                      <span className="text-white/80 font-mono text-sm">
                        {companyInfo?.id ? `#${companyInfo.id.slice(0, 8)}...` : 'N/A'}
                      </span>
                    </div>
                    
                    {companyInfo?.created_at && (
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/60">Created:</span>
                        <span className="text-white/80">
                          {new Date(companyInfo.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <p className="text-sm text-white/60">
                        {companyInfo 
                          ? 'Company information is read-only. Contact support for updates.'
                          : 'No company information found. Please create a company first.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Card */}
                <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md mx-auto flex flex-col items-center space-y-4">
                  <img
                    src={"https://github.com/shadcn.png"}
                    alt="Profile"
                    className="w-28 h-28 rounded-full border-2 border-white object-cover"
                  />
                  <h2 className="text-xl font-semibold">
                    {user?.fullName || user?.firstName || "User"}
                  </h2>
                  <p className="text-white/70">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>

                  {/* Additional Info */}
                  <div className="w-full mt-4 space-y-2">
                   
                    <div className="flex justify-between border-b border-white/20 pb-2">
                      <span className="text-white/50">Joined:</span>
                      <span>
                        {new Date(
                          user?.createdAt || Date.now()
                        ).toLocaleDateString()}
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