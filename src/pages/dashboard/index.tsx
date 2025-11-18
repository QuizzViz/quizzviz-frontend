"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";

// Layout pieces
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import CreateQuizCard from "@/components/CreateQuizCard";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { GenerationQueue } from "@/components/Dashboard/Queue";
import { QuizLibrary } from "@/components/Dashboard/Library";
import { queuedQuizzes, previousQuizzes } from "@/components/Dashboard/data";
import { PlanInfoBanner } from "@/components/PlanInfoBanner";
import { useUserPlan } from "@/hooks/useUserPlan";
import { getPlanLimits } from "@/config/plans";

// Dashboard route with auth guard and modular sections
export default function Dashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Get user plan with loading and error states
  const { data: userPlan, isLoading: isLoadingPlan, error: planError } = useUserPlan();

  // Get plan limits with fallback to Free plan if not loaded yet
  const planLimits = userPlan?.plan_name 
    ? getPlanLimits(userPlan.plan_name) 
    : getPlanLimits('Free');
    
  const maxQuestions = planLimits.maxQuestions;

  useEffect(() => {
    if (isUserLoaded && !user) router.push("/signup");
    else if (isUserLoaded) setIsLoading(false);
  }, [isUserLoaded, user, router]);

  if (isLoading || !isUserLoaded || isLoadingPlan) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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