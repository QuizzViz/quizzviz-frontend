"use client";

import { ReactNode } from "react";
import Head from "next/head";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardAccess>
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
            {children}
          </main>
        </div>
      </div>
    </DashboardAccess>
  );
}