"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";

export default function ProfilePage() {
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
    <DashboardAccess>
      <Head>
        <title>Profile | QuizzViz</title>
       <link rel="icon" href="/favicon.ico" />

        <meta
          name="description"
          content="Manage your profile details and account information."
        />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            {/* Sidebar - no border here since sidebar handles its own border */}
            <div className="bg-white">
              <DashboardSideBar />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
              <DashboardHeader
               />

              <main className="flex-1 p-6 space-y-6">
                <h1 className="text-2xl font-semibold">Profile</h1>

                {/* Profile Card */}
                <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md mx-auto flex flex-col items-center space-y-4">
                  <img
                    src={"https://github.com/shadcn.png"}
                    alt="Profile"
                    className="w-28 h-28 rounded-full border-2 border-white object-cover"
                  />
                  <h2 className="text-xl font-semibold">
                    {user?.fullName || user?.firstName || "User"}
                  </h2>
                  <p className="text-white/70">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>

                  {/* Additional Info */}
                  <div className="w-full mt-4 space-y-2">
                   
                    <div className="flex justify-between border-b border-white/20 pb-2">
                      <span className="text-white/50">Joined:</span>
                      <span>
                        {new Date(
                          user?.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">
                Redirecting to sign in...
              </h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        </SignedOut>
      </div>
    </DashboardAccess>
  );
}