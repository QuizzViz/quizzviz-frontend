"use client";

import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Head from "next/head";
import CreateQuizCard from "@/components/CreateQuizCard";
import { PageLoading } from "@/components/ui/page-loading";
import { useEffect, useState } from "react";

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

  if (!isLoaded) {
    return null; // Let the layout handle the initial loading state
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
      
      <SignedIn>
        {isLoading ? (
          <PageLoading />
        ) : (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <CreateQuizCard 
              maxQuestions={maxQuestions} 
              isLimitReached={false}
              onUpgradeClick={() => router.push('/pricing')}
            />
            {/* Add more dashboard components here */}
          </div>
        )}
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4">
              Redirecting to sign in...
            </h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}