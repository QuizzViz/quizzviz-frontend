"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
  const [error, setError] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    setError(rqError ? (rqError as Error).message : null);
  }, [quizzesData, rqError]);

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

  useEffect(() => {
    if (questions) setLocalQuestions(questions);
  }, [questions]);

  // Modal state for add/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<{
    id?: number | string;
    type: string;
    question: string;
    code_snippet?: string | null;
    options: { A: string; B: string; C: string; D: string };
    correct_answer: "A" | "B" | "C" | "D";
  }>({
    type: "theory",
    question: "",
    code_snippet: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "A",
  });

  function openAddModal() {
    setEditIndex(null);
    setForm({ type: "theory", question: "", code_snippet: "", options: { A: "", B: "", C: "", D: "" }, correct_answer: "A" });
    setIsModalOpen(true);
  }

  function openEditModal(index: number) {
    const q = localQuestions[index];
    setEditIndex(index);
    setForm({
      id: q.id,
      type: q.type,
      question: q.question,
      code_snippet: q.code_snippet ?? "",
      options: {
        A: q.options?.A ?? "",
        B: q.options?.B ?? "",
        C: q.options?.C ?? "",
        D: q.options?.D ?? "",
      },
      correct_answer: (q.correct_answer as any) || "A",
    });
    setIsModalOpen(true);
  }

  const persistQuiz = async (updated: QuizQuestion[]) => {
    if (!quiz || !user) return;

    try {
      const payload = {
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        num_questions: updated.length,
        theory_questions_percentage: quiz.theory_questions_percentage,
        code_analysis_questions_percentage: quiz.code_analysis_questions_percentage,
        quiz: updated,
      };

      const res = await fetch(`/api/quiz/${encodeURIComponent(quiz.quiz_id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to update quiz (${res.status})`);
      }

      const data = await res.json();
      
      toast({
        title: "Saved",
        description: "Quiz updated successfully",
        className: "border-emerald-500/40 bg-emerald-600/20 text-emerald-100",
      });

      // Invalidate the quizzes query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["quizzes", user.id] });
      return data;
    } catch (e: any) {
      console.error('Update quiz error:', e);
      toast({
        title: "Update failed",
        description: e?.message || "Unable to save quiz",
        className: "border-red-500/40 bg-red-600/20 text-red-100",
      });
      throw e;
    }
  };

  function handleMoveUp(index: number) {
    if (index <= 0) return;
    const next = [...localQuestions];
    const tmp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = tmp;
    setLocalQuestions(next);
    persistQuiz(next);
  }

  function handleFormChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value } as typeof form;
      // If type switches to theory, clear code_snippet and disallow editing
      if (key === "type" && (value as any) !== "code_analysis") {
        (next as any).code_snippet = "";
      }
      return next;
    });
  }

  function handleOptionChange(key: "A" | "B" | "C" | "D", value: string) {
    setForm((f) => ({ ...f, options: { ...f.options, [key]: value } }));
  }

  async function handleSaveQuestion() {
    const newQ: QuizQuestion = {
      id: form.id ?? Date.now(),
      type: form.type,
      question: form.question,
      code_snippet: form.type === "code_analysis" && form.code_snippet ? form.code_snippet : null,
      options: { ...form.options },
      correct_answer: form.correct_answer,
    } as any;

    const updated = [...localQuestions];
    if (editIndex === null) updated.push(newQ);
    else updated[editIndex] = newQ;
    setLocalQuestions(updated);
    setIsModalOpen(false);
    await persistQuiz(updated);
  }

  const handleDeleteQuiz = async () => {
    if (!quiz || !user) {
      toast({
        title: "Error",
        description: "Missing quiz or user information",
        className: "border-red-500/40 bg-red-600/20 text-red-100",
      });
      return;
    }

    try {
      const res = await fetch(`/api/quiz/${encodeURIComponent(quiz.quiz_id)}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to delete quiz (${res.status})`);
      }

      // Invalidate the quizzes query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["quizzes", user.id] });
      
      // Show success message
      toast({
        title: "Deleted",
        description: "Quiz has been deleted",
        className: "border-emerald-500/40 bg-emerald-600/20 text-emerald-100",
      });

      // Navigate back to the quizzes list
      router.push("/dashboard/my-quizzes");
    } catch (e: any) {
      console.error('Delete quiz error:', e);
      toast({
        title: "Delete failed",
        description: e?.message || "Unable to delete quiz",
        className: "border-red-500/40 bg-red-600/20 text-red-100",
      });
    }
  };

  const userName = user?.fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "User";

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>{quiz ? `${quiz.topic} Quiz` : "Quiz"} | QuizzViz</title>
      </Head>
      <SignedIn>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="bg-white border-r border-white">
            <DashboardSideBar />
          </div>
    {/* Edit/Add Question Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editIndex === null ? "Add Question" : "Update Question"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Question</label>
            <textarea
              value={form.question}
              onChange={(e) => handleFormChange("question", e.target.value)}
              className="w-full rounded-md bg-zinc-900 border border-white/10 p-3 min-h-[100px]"
            />
          </div>
          {form.type === "code_analysis" && (
            <div>
              <label className="block text-sm mb-1">Code Snippet</label>
              <textarea
                value={form.code_snippet || ""}
                onChange={(e) => handleFormChange("code_snippet", e.target.value)}
                className="w-full rounded-md bg-zinc-900 border border-white/10 p-3 font-mono min-h-[120px]"
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Question Type</label>
              <select
                value={form.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
                className="w-full rounded-md bg-zinc-900 border border-white/10 p-2"
              >
                <option value="theory">theory</option>
                <option value="code_analysis">code_analysis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Correct Answer</label>
              <select
                value={form.correct_answer}
                onChange={(e) => handleFormChange("correct_answer", e.target.value as any)}
                className="w-full rounded-md bg-zinc-900 border border-white/10 p-2"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Option A</label>
              <input value={form.options.A} onChange={(e) => handleOptionChange("A", e.target.value)} className="w-full rounded-md bg-zinc-900 border border-white/10 p-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Option B</label>
              <input value={form.options.B} onChange={(e) => handleOptionChange("B", e.target.value)} className="w-full rounded-md bg-zinc-900 border border-white/10 p-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Option C</label>
              <input value={form.options.C} onChange={(e) => handleOptionChange("C", e.target.value)} className="w-full rounded-md bg-zinc-900 border border-white/10 p-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Option D</label>
              <input value={form.options.D} onChange={(e) => handleOptionChange("D", e.target.value)} className="w-full rounded-md bg-zinc-900 border border-white/10 p-2" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveQuestion}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            <DashboardHeader
              userName={user?.fullName || user?.firstName || "User"}
              userEmail={user?.emailAddresses?.[0]?.emailAddress}
            />
            <main className="flex-1 p-6 pt-14">
              {!isLoaded || rqLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="border border-red-500/40 text-red-300 rounded-lg p-4">{error}</div>
              ) : !quiz ? (
                <div className="text-white/70">Quiz not found.</div>
              ) : (
                <div className="mx-auto max-w-5xl space-y-8">
                  <header className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-white">
                          {quiz.topic} Quiz
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                          <Badge variant="secondary">{quiz.difficulty}</Badge>
                          <span>• {localQuestions.length} questions</span>
                          <span>• Theory {quiz.theory_questions_percentage}%</span>
                          <span>• Code {quiz.code_analysis_questions_percentage}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={openAddModal}>Add Question</Button>
                        <Button variant="destructive" onClick={handleDeleteQuiz}>Delete Quiz</Button>
                      </div>
                    </div>
                  </header>

                  <section className="space-y-6">
                    {localQuestions && localQuestions.length > 0 ? (
                      localQuestions.map((q, idx) => (
                        <Card key={q.id ?? idx} className="bg-zinc-950 border-white/10">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-xl text-white">Question {idx + 1}</CardTitle>
                                <Badge>{q.type.replace(/_/g, " ")}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => openEditModal(idx)}>Update</Button>
                              </div>
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
