"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  is_publish?: boolean;
  isPublished?: boolean; // For backward compatibility
  public_link?: string; // For sharing published quizzes
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

  // React Query - cache quizzes per user
  const { data: quizzesData, isLoading: rqLoading, isFetching: rqFetching, error: rqError } = useQuery<QuizSummary[]>({
    queryKey: ["quizzes", user?.id],
    enabled: Boolean(isLoaded && user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/quizzes?userId=${encodeURIComponent(user!.id)}`);
      if (!res.ok) throw new Error((await res.text()) || `Failed to fetch quizzes (${res.status})`);
      return res.json();
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (quizzesData) setQuizzes(quizzesData);
    setIsFetchingQuizzes(rqFetching);
    setFetchError(rqError ? (rqError as Error).message : null);
  }, [quizzesData, rqFetching, rqError]);

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
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
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
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs">
                                  Theory {q.theory_questions_percentage}%
                                </span>
                                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-300 text-xs">
                                  Code {q.code_analysis_questions_percentage}%
                                </span>
                              </div>
                              
                              {/* Show Published/Unpublished status */}
                              <div className="mt-1">
                                {q.is_publish || q.isPublished ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Published
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    Not Published
                                  </span>
                                )}
                              </div>
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
