"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Link from "next/link";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuizSummary {
  quiz_id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz: string; // JSON string of questions
  created_at?: string;
}

export default function MyQuizzesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) router.push("/signin");
    else if (isLoaded) setIsLoading(false);
  }, [isLoaded, user, router]);

  // Fetch quizzes for the signed-in user
  useEffect(() => {
    const load = async () => {
      if (!isLoaded || !user) return;
      setIsFetchingQuizzes(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/quizzes?userId=${encodeURIComponent(user.id)}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to fetch quizzes (${res.status})`);
        }
        const data: QuizSummary[] = await res.json();
        setQuizzes(data);
      } catch (e: any) {
        setFetchError(e?.message || "Failed to load quizzes");
      } finally {
        setIsFetchingQuizzes(false);
      }
    };
    load();
  }, [isLoaded, user]);

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
        <title>My Quizzes | QuizzViz</title>
        <meta
          name="description"
          content="View and manage your created quizzes on QuizzViz."
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
              <DashboardHeader
                userName={user?.fullName || user?.firstName || "User"}
                userEmail={user?.emailAddresses?.[0]?.emailAddress}
              />
              <main className="flex-1 p-6 pt-10 space-y-6">{/* extra top padding for elegance */}
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold">My Quizzes</h1>
                    <p className="text-white/70">Browse your generated quizzes and open any to view full details.</p>
                  </div>
                </div>
                {fetchError ? (
                  <div className="border border-red-500/40 text-red-300 rounded-lg p-4">
                    {fetchError}
                  </div>
                ) : isFetchingQuizzes && !quizzes ? (
                  <div className="text-white/70">Loading quizzes...</div>
                ) : !quizzes || quizzes.length === 0 ? (
                  <div className="border border-white/10 rounded-lg p-6">No quizzes to show yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {quizzes.map((q) => (
                      <Link
                        key={q.quiz_id}
                        href={`/quiz/${q.quiz_id}`}
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <Card className="relative overflow-hidden cursor-pointer border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900 transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-blue-500/10 group-hover:border-white/20">
                          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[radial-gradient(600px_circle_at_var(--x,50%)_var(--y,50%),rgba(59,130,246,0.08),transparent_40%)]" />
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xl font-semibold text-white">{q.topic}</CardTitle>
                              <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30">{q.difficulty}</Badge>
                            </div>
                            <CardDescription className="text-white/70">
                              <span className="font-medium text-white">{q.num_questions}</span> questions
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                                Theory {q.theory_questions_percentage}%
                              </span>
                              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-300">
                                Code {q.code_analysis_questions_percentage}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </main>
            </div>
          </div>
        </SignedIn>

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
