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

export default function Dashboard() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Set default values for Business plan
  const maxQuestions = 100; // Business plan limit
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

  // Show full page loading if Clerk is not loaded yet
  if (!isLoaded) {
    return <PageLoading fullScreen />;
  }

  return (
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
  );
}