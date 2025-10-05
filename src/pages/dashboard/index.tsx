"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";

// Layout pieces
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import CreateQuizCard from "@/components/CreateQuizCard";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { GenerationQueue } from "@/components/Dashboard/Queue";
import { QuizLibrary } from "@/components/Dashboard/Library";
import { queuedQuizzes, previousQuizzes } from "@/components/Dashboard/data";
import { currentPlan, PLAN_TYPE } from "@/config/plans";
import { PlanInfoBanner } from "@/components/PlanInfoBanner";

// Dashboard route with auth guard and modular sections
export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) router.push("/signin");
    else if (isLoaded) setIsLoading(false);
  }, [isLoaded, user, router]);

  if (isLoading || !isLoaded) {
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
              <CreateQuizCard maxQuestions={currentPlan.maxQuestions} />
              {/* <GenerationQueue items={queuedQuizzes} /> */}
              {/* <QuizLibrary items={previousQuizzes} /> */}
              <PlanInfoBanner />
              {PLAN_TYPE === 'Consumer' && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
                  <p>You're on the <span className="font-semibold">Consumer Plan</span> with a limit of {currentPlan.maxQuestions} questions per quiz.</p>
                  <p className="mt-1">Upgrade to <span className="font-semibold">Business Plan</span> for more questions per quiz and advanced features.</p>
                </div>
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
