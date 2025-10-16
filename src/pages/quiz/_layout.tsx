import React from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardSideBar from '@/components/SideBar/DashboardSidebar';
import { DashboardHeader } from '@/components/Dashboard/Header';
import Head from 'next/head';

interface QuizLayoutProps {
  children: React.ReactNode;
}

export default function QuizLayout({ children }: QuizLayoutProps) {
  const { user } = useUser();
  
  return (
    <>
      <Head>
        <title>Quiz | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="bg-white border-r border-white">
            <DashboardSideBar />
          </div>
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            <DashboardHeader
              userName={user?.fullName || user?.firstName || "User"}
              userEmail={user?.emailAddresses?.[0]?.emailAddress}
            />
            <main className="flex-1 p-6 pt-10">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
