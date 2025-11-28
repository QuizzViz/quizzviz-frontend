// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
// import Head from "next/head";

// // Layout pieces
// import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
// import CreateQuizCard from "@/components/CreateQuizCard";
// import { DashboardHeader } from "@/components/Dashboard/Header";
// import { GenerationQueue } from "@/components/Dashboard/Queue";
// import { QuizLibrary } from "@/components/Dashboard/Library";
// import { queuedQuizzes, previousQuizzes } from "@/components/Dashboard/data";
// import { PlanInfoBanner } from "@/components/PlanInfoBanner";
// import { useUserPlan } from "@/hooks/useUserPlan";
// import { getPlanLimits } from "@/config/plans";

// // Dashboard route with auth guard and modular sections
// export default function Dashboard() {
//   const { user, isLoaded: isUserLoaded } = useUser();
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);

//   // Get user plan with loading and error states
//   const { data: userPlan, isLoading: isLoadingPlan, error: planError } = useUserPlan();

//   // Get plan limits with fallback to Free plan if not loaded yet
//   const planLimits = userPlan?.plan_name 
//     ? getPlanLimits(userPlan.plan_name) 
//     : getPlanLimits('Free');
    
//   const maxQuestions = planLimits.maxQuestions;

//   useEffect(() => {
//     if (isUserLoaded && !user) router.push("/signup");
//     else if (isUserLoaded) setIsLoading(false);
//   }, [isUserLoaded, user, router]);

//   if (isLoading || !isUserLoaded || isLoadingPlan) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <>
//     <Head>
//       <title>Dashboard | QuizzViz</title>
//       <meta
//         name="description"
//         content="Manage and generate AI-powered coding quizzes. Review generation queue and your quiz library."
//       />
//     </Head>
//     <div className="min-h-screen bg-black text-white">
//       <SignedIn>
//         <div className="flex min-h-screen">
//           {/* Sidebar */}
//           <div className="bg-white border-r border-white">
//             <DashboardSideBar />
//           </div>
//           {/* Main content */}
//           <div className="flex-1 flex flex-col">
//             <DashboardHeader userName={user?.fullName || user?.firstName || "User"} userEmail={user?.emailAddresses?.[0]?.emailAddress} />
//             <main className="flex-1 p-6 space-y-8">
//               {planError ? (
//                 <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
//                   Error loading plan information: {planError.message}
//                 </div>
//               ) : (
//                 <>
//                   <CreateQuizCard maxQuestions={maxQuestions} />
//                   {/* <GenerationQueue items={queuedQuizzes} /> */}
//                   {/* <QuizLibrary items={previousQuizzes} /> */}
//                   <PlanInfoBanner />
//                 </>
//               )}
//             </main>
//           </div>
//         </div>
//       </SignedIn>

//       {/* Redirect to Sign In */}
//       <SignedOut>
//         <div className="flex items-center justify-center h-screen">
//           <div className="text-center">
//             <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">Redirecting to sign in...</h1>
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
//           </div>
//         </div>
//       </SignedOut>
//     </div>
//     </>
//   );
// }
'use client';

import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6 p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl">
        
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-slate-700 p-5 rounded-full">
            <svg 
              className="w-12 h-12 text-slate-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
        
        {/* Heading */}
        <h1 className="text-4xl font-bold text-white">
          Under Maintenance
        </h1>
        
        {/* Message */}
        <p className="text-lg text-slate-300">
          QuizzViz is currently undergoing maintenance. We'll be back online soon. Thank you for your patience.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;