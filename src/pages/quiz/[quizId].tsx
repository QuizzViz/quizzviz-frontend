"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import { useToast } from "@/hooks/use-toast";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { QuizEditor } from "@/components/Quiz/QuizEditor";
import { useUserPlanContext } from "@/contexts/UserPlanContext";

export default function QuizDetailsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  
  const { plan, isLoading: isPlanLoading } = useUserPlanContext();

  // Redirect to 404 if not a Business plan user
  useEffect(() => {
    if (!isPlanLoading && plan !== 'Business') {
      toast({
        title: 'Access Denied',
        description: 'This feature is only available for Business plan users.',
        variant: 'destructive',
      });
      router.push('/pricing');
    }
  }, [router, toast, plan, isPlanLoading]);
  
  // Get the quiz ID from the URL
  const { quizId } = router.query as { quizId?: string };
  
  // Get user info for the page title
  const userName = user?.fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "User";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Quiz Editor | {userName}</title>
      </Head>
      
      <SignedIn>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <DashboardSideBar
            mobileWidthClass="w-11/12 max-w-xl"
            menuIconSizeClass="w-10 h-10"
            navIconSizeClass="w-6 h-6"
            navTextSizeClass="text-base"
            itemPaddingClass="p-3.5"
          />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col relative z-10">
            <DashboardHeader
              userName={user?.fullName || user?.firstName || "User"}
              userEmail={user?.emailAddresses?.[0]?.emailAddress}
            />
            
            <main className="flex-1 p-6 pt-14 relative">
              {(!isLoaded || isPlanLoading) ? (
                <div className="flex items-center justify-center h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : !quizId ? (
                <div className="text-white/70">No quiz selected.</div>
              ) : (
                <QuizEditor />
              )}
            </main>
          </div>
        </div>
      </SignedIn>
      
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">
              Please sign in to view this quiz.
            </h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
