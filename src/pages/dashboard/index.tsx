"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/nextjs";
import { ArrowRight, Lock, Zap, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Head from "next/head";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Layout pieces
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import CreateQuizCard from "@/components/CreateQuizCard";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Button } from "@/components/ui/button";

// Dashboard route with auth guard and modular sections
export default function Dashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{name: string; owner_email: string} | null>(null);
  // Set default values for Business plan
  const maxQuestions = 100; // Business plan limit
  const quizLimit = 20; // Monthly quiz limit

  useEffect(() => {
    const checkCompanyAccess = async () => {
      if (!isUserLoaded) {
        return;
      }

      if (!user) {
        router.push('/signin');
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`/api/company/check?owner_id=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          cache: 'no-store' // Ensure fresh data
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch company data');
        }
        
        const data = await response.json();
        
        if (data.companies && data.companies.length > 0) {
          // Company exists, grant access and set company info
          setHasAccess(true);
          setCompanyInfo({
            name: data.companies[0].name,
            owner_email: data.companies[0].owner_email
          });
          
          // Quiz usage will be handled in a separate page
        } else {
          // No company found
          setHasAccess(false);
          setCompanyInfo(null);
        }
      } catch (error) {
        console.error('Error checking company:', error);
        toast({
          title: 'Error',
          description: 'Failed to load company information. Please try again.',
          variant: 'destructive',
        });
        // Default to no access on error
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompanyAccess();
  }, [isUserLoaded, user, router, getToken]);

  if (isLoading || !isUserLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Show message if user doesn't have a company
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="max-w-2xl w-full bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold">Welcome to Dashboard</h2>
                <p className="text-gray-400 text-lg">
                  You need to create a company to get started with QuizzViz.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/onboarding')}
                className="mt-4 font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 px-8 py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                Create Your Company
                <ArrowRight className="ml-1 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | QuizzViz</title>
        <meta
          name="description"
          content="Manage and generate AI-powered coding quizzes. Review generation queue and your quiz library."
        />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            {/* Main content */}
            <div className="flex-1 flex flex-col">
              <DashboardHeader 
                userName={companyInfo?.name || user?.fullName || 'User'} 
                userEmail={companyInfo?.owner_email || user?.emailAddresses?.[0]?.emailAddress} 
              />
              <main className="flex-1 p-6 space-y-8">
                <CreateQuizCard 
                  maxQuestions={maxQuestions} 
                  isLimitReached={false}
                  onUpgradeClick={() => router.push('/pricing')}
                />
              </main>
            </div>
          </div>
        </SignedIn>

        {/* Redirect to Sign In */}
        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">Redirecting to sign in...</h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        </SignedOut>
      </div>
    </>
  );
}