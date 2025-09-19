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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check } from "lucide-react";

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
    if (!quiz) return undefined;
    
    try {
      // Handle different possible formats of quiz data
      let questionsData: any[] = [];
      
      // Case 1: quiz.quiz is already an array
      if (Array.isArray(quiz.quiz)) {
        questionsData = quiz.quiz;
      } 
      // Case 2: quiz.quiz is a JSON string
      else if (typeof quiz.quiz === 'string') {
        try {
          const parsed = JSON.parse(quiz.quiz);
          questionsData = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Failed to parse quiz string:', e);
        }
      }
      
      // Ensure each question has required fields
      return questionsData.map((q, index) => ({
        id: q.id || `q-${index}`,
        type: q.type || 'theory',
        question: q.question || 'No question text',
        code_snippet: q.code_snippet || null,
        options: q.options || { A: '', B: '', C: '', D: '' },
        correct_answer: q.correct_answer || 'A',
        ...q // Spread any additional fields
      }));
      
    } catch (e) {
      console.error('Error parsing quiz questions:', e);
      return [];
    }
  }, [quiz]);

  useEffect(() => {
    if (questions) setLocalQuestions(questions);
  }, [questions]);

  // Set origin on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Modal state for add/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteQuestionDialogOpen, setIsDeleteQuestionDialogOpen] = useState(false);
  const [questionIndexToDelete, setQuestionIndexToDelete] = useState<number | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [origin, setOrigin] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  const totalQuestions = localQuestions.length;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  
  // Get current questions
  const currentQuestions = useMemo(() => {
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    return localQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  }, [localQuestions, currentPage]);
  
  // Reset to first page when questions change
  useEffect(() => {
    setCurrentPage(1);
  }, [localQuestions.length]);
  const [publishSettings, setPublishSettings] = useState({
    secretKey: "",
    timeLimit: 30,
    maxAttempts: 1,
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isSecretKeyRequired: true
  });
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
        className: "border-blue-500/40 bg-blue-700 text-blue-100",
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
        className: "border-red-500/40 bg-red-600 text-red-100",
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
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const confirmDeleteQuiz = () => {
    setIsDeleteDialogOpen(true);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // TODO: Implement actual publish API call
      console.log('Publishing quiz with settings:', publishSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast({
        title: "Quiz Published!",
        description: "Your quiz is now live and can be accessed with the shared link.",
        className: "border-green-500/40 bg-green-600/20 text-green-100",
      });
      
      // Close the modal
      setIsPublishModalOpen(false);
    } catch (error) {
      console.error('Error publishing quiz:', error);
      toast({
        title: "Error",
        description: "Failed to publish quiz. Please try again.",
        className: "border-red-500/40 bg-red-600/20 text-red-100",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    const quizLink = `${origin}/quiz/take/${quiz?.quiz_id}`;
    navigator.clipboard.writeText(quizLink);
    
    toast({
      title: "Link copied to clipboard!",
      description: "Share this link with your participants.",
      className: "border-green-500/40 bg-green-600/20 text-green-100",
    });
  };

  // Open confirm for deleting a specific question
  const confirmDeleteQuestion = (index: number) => {
    setQuestionIndexToDelete(index);
    setIsDeleteQuestionDialogOpen(true);
  };

  // Delete a specific question then persist via PUT
  const handleDeleteQuestion = async () => {
    if (questionIndexToDelete === null) return;
    const updated = localQuestions.filter((_, i) => i !== questionIndexToDelete);
    setLocalQuestions(updated);
    setIsDeleteQuestionDialogOpen(false);
    setQuestionIndexToDelete(null);
    await persistQuiz(updated);
    toast({
      title: "Question removed",
      description: "The question has been deleted from the quiz.",
      className: "border-red-500/40 bg-red-600 text-red-100",
    });
  };

  const userName = user?.fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "User";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>{quiz ? `${quiz.topic} Quiz` : "Quiz"} | {userName}</title>
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

          {/* Publish Quiz Modal */}
          <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Publish Quiz</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div>
                  <Label htmlFor="quizLink" className="text-white">Quiz Link</Label>
                  <div className="flex mt-1">
                    <Input
                      id="quizLink"
                      readOnly
                      value={origin ? `${origin}/quiz/take/${quiz?.quiz_id}` : 'Loading...'}
                      className="rounded-r-none bg-zinc-800 border-white/10 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-l-none border-l-0 bg-zinc-800 hover:bg-zinc-700 text-white"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Share this link with participants to take the quiz
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="requireSecretKey" 
                      checked={publishSettings.isSecretKeyRequired}
                      onCheckedChange={(checked) => setPublishSettings(prev => ({...prev, isSecretKeyRequired: checked === true}))}
                      className="border-white/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="requireSecretKey" className="text-white font-normal">
                      Require a secret key to access this quiz
                    </Label>
                  </div>
                  
                  {publishSettings.isSecretKeyRequired && (
                    <div className="pl-6">
                      <Label htmlFor="secretKey" className="text-white">Secret Key</Label>
                      <Input
                        id="secretKey"
                        type="text"
                        value={publishSettings.secretKey}
                        onChange={(e) => setPublishSettings(prev => ({...prev, secretKey: e.target.value}))}
                        placeholder="Enter a secret key"
                        className="mt-1 bg-zinc-800 border-white/10 text-white"
                      />
                      <p className="text-xs text-white/50 mt-1">
                        Participants will need to enter this key to access the quiz
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeLimit" className="text-white">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="1"
                      value={publishSettings.timeLimit}
                      onChange={(e) => setPublishSettings(prev => ({...prev, timeLimit: Number(e.target.value) || 30}))}
                      className="mt-1 bg-zinc-800 border-white/10 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxAttempts" className="text-white">Max Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="1"
                      value={publishSettings.maxAttempts}
                      onChange={(e) => setPublishSettings(prev => ({...prev, maxAttempts: Number(e.target.value) || 1}))}
                      className="mt-1 bg-zinc-800 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expirationDate" className="text-white">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={publishSettings.expirationDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPublishSettings(prev => ({
                      ...prev, 
                      expirationDate: e.target.value || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }))}
                    className="mt-1 bg-zinc-800 border-white/10 text-white"
                  />
                  <p className="text-xs text-white/50 mt-1">
                    The quiz will be automatically closed after this date
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPublishModalOpen(false)} 
                  disabled={isPublishing}
                  className="text-white border-white/20 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handlePublish} 
                  disabled={isPublishing || (publishSettings.isSecretKeyRequired && !publishSettings.secretKey.trim())}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPublishing ? "Publishing..." : "Publish Quiz"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Main content */}
          <div className="flex-1 flex flex-col relative z-10">
            <DashboardHeader
              userName={user?.fullName || user?.firstName || "User"}
              userEmail={user?.emailAddresses?.[0]?.emailAddress}
            />
            <main className="flex-1 p-6 pt-14 relative">
              {!isLoaded || rqLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="border border-red-500/40 text-red-300 rounded-lg p-4">{error}</div>
              ) : !quiz ? (
                <div className="text-white/70">Quiz not found.</div>
              ) : (
                <div className="mx-auto max-w-5xl space-y-8 px-3 sm:px-4">
                  <header className="space-y-2">
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                          {quiz.topic} Quiz
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                          <Badge variant="secondary">{quiz.difficulty}</Badge>
                          <span>• {localQuestions.length} questions</span>
                          <span>• Theory {quiz.theory_questions_percentage}%</span>
                          <span>• Code {quiz.code_analysis_questions_percentage}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap relative z-10 pointer-events-auto">
                        <Button variant="outline" className="pointer-events-auto" onClick={openAddModal}>Add Question</Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white pointer-events-auto"
                          onClick={() => setIsPublishModalOpen(true)}
                        >
                          Publish Quiz
                        </Button>
                        <Button variant="destructive" className="pointer-events-auto hover:bg-red-700" onClick={confirmDeleteQuiz}>Delete Quiz</Button>
                      </div>
                    </div>
                  </header>

                  <section className="space-y-6">
                    {currentQuestions && currentQuestions.length > 0 ? (
                      currentQuestions.map((q, idx) => {
                        // Calculate global question number
                        const globalQuestionNumber = (currentPage - 1) * questionsPerPage + idx + 1;
                        
                        return (
                          <Card key={q.id ?? idx} className="bg-zinc-950 border-white/10">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-xl text-white">Question {globalQuestionNumber}</CardTitle>
                                <Badge>{q.type.replace(/_/g, " ")}</Badge>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap relative z-10 pointer-events-auto">
                                <Button size="sm" className="pointer-events-auto hover:bg-blue-700" onClick={() => openEditModal(idx)}>Update</Button>
                                <Button size="sm" className="pointer-events-auto hover:bg-red-700" variant="destructive" onClick={() => confirmDeleteQuestion(idx)}>Delete</Button>
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
                        );
                      })
                    ) : (
                      <div className="text-white/70">No questions available for this quiz.</div>
                    )}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-8">
                        {/* Desktop Pagination */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="text-sm text-gray-300">
                            Showing <span className="font-medium">
                              {Math.min((currentPage - 1) * questionsPerPage + 1, totalQuestions)}
                            </span> to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * questionsPerPage, totalQuestions)}
                            </span>{' '}
                            of <span className="font-medium">{totalQuestions}</span> questions
                          </div>
                          
                          <nav className="flex items-center space-x-1">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Previous"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                              // Show first, last, and pages around current page
                              if (
                                pageNum === 1 || 
                                pageNum === totalPages || 
                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) ||
                                (currentPage <= 3 && pageNum <= 5) ||
                                (currentPage >= totalPages - 2 && pageNum >= totalPages - 4)
                              ) {
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                                      currentPage === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              }
                              
                              // Show ellipsis
                              if (
                                (pageNum === 2 && currentPage > 3) ||
                                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                              ) {
                                return (
                                  <span key={`ellipsis-${pageNum}`} className="px-2 py-2 text-gray-400">
                                    ...
                                  </span>
                                );
                              }
                              
                              return null;
                            })}
                            
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Next"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                        
                        {/* Mobile Pagination */}
                        <div className="sm:hidden flex items-center justify-between mt-4">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Previous
                          </button>
                          
                          <span className="text-sm text-gray-300">
                            Page {currentPage} of {totalPages}
                          </span>
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </main>
          </div>
        </div>
      </SignedIn>

      {/* Global confirmation dialogs */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteQuiz}
        title="Delete Quiz"
        description="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmText="Delete Quiz"
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={isDeleteQuestionDialogOpen}
        onClose={() => setIsDeleteQuestionDialogOpen(false)}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        description="Are you sure you want to delete this question from the quiz?"
        confirmText="Delete Question"
        variant="destructive"
      />

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
