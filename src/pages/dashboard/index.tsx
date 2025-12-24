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
import { PlanInfoBanner } from "@/components/PlanInfoBanner";
import { useUserPlan } from "@/hooks/useUserPlan";
import { getPlanLimits } from "@/config/plans";
import { Button } from "@/components/ui/button";

// Dashboard route with auth guard and modular sections
export default function Dashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [companyPlan, setCompanyPlan] = useState('');

  // Get user plan with loading and error states
  const { data: userPlan, isLoading: isLoadingPlan, error: planError } = useUserPlan();

  // Get plan limits with fallback to Free plan if not loaded yet
  const planLimits = userPlan?.plan_name 
    ? getPlanLimits(userPlan.plan_name) 
    : getPlanLimits('Free');
  const maxQuestions = planLimits.maxQuestions;

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
          // Company exists, check the plan
          const company = data.companies[0];
          const plan = company.plan_name || 'Free';
          setCompanyPlan(plan);
          setHasAccess(plan === 'Business');
        } else {
          // No company found
          setCompanyPlan('');
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking company:', error);
        toast({
          title: 'Error',
          description: 'Failed to load company information. Please try again.',
          variant: 'destructive',
        });
        // Default to no access on error
        setCompanyPlan('');
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompanyAccess();
  }, [isUserLoaded, user, router, getToken]);

  if (isLoading || !isUserLoaded || isLoadingPlan) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Show appropriate message based on company and plan status
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="max-w-2xl w-full  bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-8  shadow-2xl">
            <div className="text-center space-y-6">
              {companyPlan === '' ? (
                // No company exists
                <>
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold ">Welcome to Dashboard</h2>
                    <p className="text-gray-400 text-lg">
                      You need to create a company to get started with QuizzViz.
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/onboarding')}
                    className="mt-4 font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110  px-8 py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    Create Your Company
                    <ArrowRight className="ml-1 h-6 w-6" />
                  </Button>
                </>
              ) : (
                // Company exists but not Business plan
                <div className="w-full max-w-2xl mx-auto text-center">
                  <Card className="bg-black/30 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3 border-b border-white/10">
                      <CardTitle className="text-xl font-bold text-center">
                        <span className="bg-gradient-to-r from-teal-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                          Get Full Access
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-300 text-center text-sm">
                        Unlock all QuizzViz features with a subscription
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6 md:p-8">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 flex items-center justify-center mb-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500/10 to-green-500/10 flex items-center justify-center">
                          <Lock className="h-7 w-7 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-6 mb-8">
                        <p className="text-gray-200 text-base leading-relaxed">
                          You need an active subscription to access the QuizzViz Dashboard.
                        </p>
                        <p className="text-gray-300 text-sm">
                          Subscribe now to create and manage quizzes, access analytics, and unlock all features.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => router.push('/pricing')}
                        className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl group rounded-lg"
                      >
                        <span className="flex items-center justify-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Upgrade Now
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                      
                      <div className="flex items-center justify-center gap-3 mt-6 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-green-400" />
                          <span>Quick Setup</span>
                        </div>
                        <span className="text-white/30">|</span>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-blue-400" />
                          <span>Secure Access</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
              <DashboardHeader userName={user?.fullName || user?.firstName || "User"} userEmail={user?.emailAddresses?.[0]?.emailAddress} />
              <main className="flex-1 p-6 space-y-8">
                {planError ? (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error loading plan information: {planError.message}
                  </div>
                ) : (
                  <>
                    <CreateQuizCard maxQuestions={maxQuestions} />
                    {/* <GenerationQueue items={queuedQuizzes} /> */}
                    {/* <QuizLibrary items={previousQuizzes} /> */}
                    <PlanInfoBanner />
                  </>
                )}
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