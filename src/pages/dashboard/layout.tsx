"use client";

import { ReactNode } from "react";
import Head from "next/head";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { useUser } from "@clerk/nextjs";
import { PageLoading } from "@/components/ui/page-loading";

export default function DashboardLayout({ 
  children,
  loading = false 
}: { 
  children: ReactNode;
  loading?: boolean;
}) {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageLoading />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Manage and generate AI-powered coding quizzes. Review generation queue and your quiz library."
        />
      </Head>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSideBar />
        <div className="flex-1 overflow-auto">
          <DashboardHeader />
          <main className="p-6">
            {loading ? <PageLoading /> : children}
          </main>
        </div>
      </div>
    </>
  );
}