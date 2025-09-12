"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";

interface QuizSummary {
  quiz_id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz: string; // JSON string
  created_at?: string;
}

interface QuizQuestion {
  id: number | string;
  type: string;
  question: string;
  code_snippet?: string | null;
  options?: Record<string, string> | null;
  correct_answer: string;
}

export default function QuizDetailsPage() {
  const router = useRouter();
  const { quizId } = router.query as { quizId?: string };

  const { user, isLoaded } = useUser();
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isLoaded) return;
      if (!user) {
        setLoading(false);
        setError("Please sign in to view this quiz.");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/quizzes?userId=${encodeURIComponent(user.id)}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to fetch quizzes (${res.status})`);
        }
        const data: QuizSummary[] = await res.json();
        setQuizzes(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoaded, user]);

  const quiz = useMemo(() => {
    if (!quizzes || !quizId) return undefined;
    return quizzes.find((q) => q.quiz_id === quizId);
  }, [quizzes, quizId]);

  const questions: QuizQuestion[] | undefined = useMemo(() => {
    if (!quiz?.quiz) return undefined;
    try {
      const parsed = JSON.parse(quiz.quiz);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [quiz]);

  const userName = user?.fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "User";

  return (
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
            <main className="flex-1 p-6 pt-14">
              {!isLoaded || loading ? (
                <div className="text-white/70">Loading quiz...</div>
              ) : error ? (
                <div className="border border-red-500/40 text-red-300 rounded-lg p-4">{error}</div>
              ) : !quiz ? (
                <div className="text-white/70">Quiz not found.</div>
              ) : (
                <div className="mx-auto max-w-5xl space-y-8">
                  <header className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">
                      {userName}'s Quiz of {quiz.topic}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                      <Badge variant="secondary">{quiz.difficulty}</Badge>
                      <span>• {quiz.num_questions} questions</span>
                      <span>• Theory {quiz.theory_questions_percentage}%</span>
                      <span>• Code {quiz.code_analysis_questions_percentage}%</span>
                    </div>
                  </header>

                  <section className="space-y-6">
                    {questions && questions.length > 0 ? (
                      questions.map((q, idx) => (
                        <Card key={q.id ?? idx} className="bg-zinc-950 border-white/10">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xl text-white">Question {idx + 1}</CardTitle>
                              <Badge>{q.type.replace(/_/g, " ")}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="whitespace-pre-wrap leading-relaxed text-white">{q.question}</p>
                            {q.code_snippet ? (
                              <pre className="overflow-x-auto rounded-md bg-zinc-900/80 p-4 text-sm text-zinc-200 border border-white/10"><code>{q.code_snippet}</code></pre>
                            ) : null}

                            {q.options ? (
                              <div className="space-y-2">
                                <h4 className="font-medium text-white">Options</h4>
                                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {Object.entries(q.options).map(([key, val]) => (
                                    <li
                                      key={key}
                                      className={`rounded-md border p-3 text-white ${key === q.correct_answer ? "border-green-600 bg-green-900/20" : "border-white/10 bg-zinc-900/40"}`}
                                    >
                                      <span className="font-semibold mr-2">{key}.</span>
                                      <span className="text-sm whitespace-pre-wrap">{val}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-white/70">No questions available for this quiz.</div>
                    )}
                  </section>
                </div>
              )}
            </main>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">Please sign in to view this quiz.</h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
