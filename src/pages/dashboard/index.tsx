"use client";

import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Head from "next/head";
import CreateQuizCard from "@/components/CreateQuizCard";
import { PageLoading } from "@/components/ui/page-loading";
import { useEffect, useState } from "react";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { useCachedDashboardData } from "@/hooks/useCachedData";
import { useAuth } from "@clerk/nextjs";

export default function Dashboard() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // For member users, get company ID from metadata or stored data
  const getCompanyIdForMember = (): string | undefined => {
    // Try user metadata first (for invited members who have it stored)
    const metadataCompanyId = user?.unsafeMetadata?.companyId as string | undefined;
    if (metadataCompanyId) return metadataCompanyId;

    // Try sessionStorage
    if (typeof window !== 'undefined') {
      const sessionCompanyId = sessionStorage.getItem('userCompanyId');
      if (sessionCompanyId) return sessionCompanyId;

      // Try localStorage
      const localCompanyId = localStorage.getItem('userCompanyId');
      if (localCompanyId) return localCompanyId;
    }

    return undefined;
  };

  const companyIdForMember: string | undefined = getCompanyIdForMember();
  
  // Use the new caching system
  const { 
    userRole, 
    company, 
    loading: roleLoading 
  } = useCachedDashboardData(user?.id || '', companyIdForMember, async () => {
    const token = await getToken();
    return token || '';
  });
  
  // Set default values for Enterprise plan
  const maxQuestions = 100; // Enterprise plan limit
  const quizLimit = 20; // Monthly quiz limit

  // Simulate loading data
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Show loading while fetching role or if Clerk is not loaded yet
  if (isLoading || roleLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 flex items-center justify-center">
                <PageLoading />
              </main>
            </div>
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">Redirecting to sign in...</h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        </SignedOut>
      </div>
    );
  }

  return (
    <DashboardAccess>
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Dashboard | QuizzViz</title>
        <meta
          name="description"
          content="Manage and generate AI-powered coding quizzes. Review generation queue and your quiz library."
        />
      </Head>
      
      <SignedIn>
        <div className="flex min-h-screen">
          <div className="bg-white border-r border-white">
            <DashboardSideBar />
          </div>
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 p-6">
              {isLoading ? (
                <PageLoading />
              ) : (
                <div className="space-y-8">
                  <CreateQuizCard 
                    maxQuestions={maxQuestions} 
                    isLimitReached={false}
                    onUpgradeClick={() => router.push('/pricing')}
                    userRole={userRole?.role}
                  />
                </div>
              )}
            </main>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <PageLoading text="Redirecting to sign in..." />
        </div>
      </SignedOut>
    </div>
    </DashboardAccess>
  );
}