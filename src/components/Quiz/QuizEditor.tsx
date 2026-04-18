"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoading } from "@/components/ui/page-loading";
import { QuizHeader } from "./QuizHeader";
import { QuestionCard } from "./QuestionCard";
import { Pagination } from "./Pagination";
import { QuestionForm } from "./QuestionForm";
import { PublishModal } from "./PublishModal";
import { ShareQuizModal } from "./ShareQuizModal";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

import {
  QuizSummary,
  QuizQuestion,
  PublishSettings,
  QuestionFormData,
} from "./types";

const QUESTIONS_PER_PAGE = 10;

interface CompanyInfo {
  id: string;
  name: string;
  owner_email?: string;
}

export function QuizEditor() {
  const router = useRouter();
  const { quizId, username } = router.query as { quizId?: string; username?: string };
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { companyInfo, isLoading: isCompanyLoading } = useCompanyInfo();

  const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteQuestionDialogOpen, setIsDeleteQuestionDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [origin, setOrigin] = useState(typeof window !== "undefined" ? window.location.origin : "");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    secretKey: "",
    timeLimit: 30,
    maxAttempts: 1,
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isSecretKeyRequired: true,
  });
  const [formData, setFormData] = useState<QuestionFormData>({
    type: "theory",
    question: "",
    code_snippet: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "A",
  });

  // Set origin once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Fetch quiz data using react-query
  const { data: quizzesData, isLoading: isQuizzesLoading, error: quizzesError } = useQuery<QuizSummary[]>({
    queryKey: ["quizzes", companyInfo?.id],
    enabled: isUserLoaded && !!user?.id && !!companyInfo?.id && !isCompanyLoading,
    queryFn: async () => {
      const res = await fetch(`/api/quizzes?companyId=${encodeURIComponent(companyInfo!.id)}`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Failed to fetch quizzes (${res.status})`);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Find current quiz
  const currentQuiz = useMemo(() => {
    if (!quizzesData || !quizId) return undefined;
    return quizzesData.find((q) => q.quiz_id === quizId);
  }, [quizzesData, quizId]);

  // Sync local questions when quiz data loads
  useEffect(() => {
    if (!currentQuiz || !quizId) return;

    try {
      let questionsData: any[] = [];

      if (Array.isArray(currentQuiz.quiz)) {
        questionsData = currentQuiz.quiz;
      } else if (typeof currentQuiz.quiz === "string") {
        questionsData = JSON.parse(currentQuiz.quiz);
      }

      const formatted = questionsData.map((q: any, idx: number) => ({
        id: q.id ?? `q-${idx}`,
        type: q.type ?? "theory",
        question: q.question ?? "No question text",
        code_snippet: q.code_snippet ?? null,
        options: q.options ?? { A: "", B: "", C: "", D: "" },
        correct_answer: q.correct_answer ?? "A",
        ...q,
      }));

      setLocalQuestions(formatted);
      setIsPublished(!!currentQuiz.is_publish);
    } catch (err) {
      console.error("Error parsing quiz questions:", err);
      setLocalQuestions([]);
    }
  }, [currentQuiz, quizId]);

  // Fetch published quiz data if published
  const { data: publishedQuiz, isLoading: isLoadingPublished } = useQuery({
    queryKey: ["publishedQuiz", quizId],
    enabled: !!currentQuiz?.is_publish && !!quizId && !!companyInfo?.id,
    queryFn: async () => {
      const res = await fetch(`/api/publish/${companyInfo!.id}/${quizId}`);
      if (!res.ok) throw new Error("Failed to fetch published quiz");
      const result = await res.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Sync publish settings from published data
  useEffect(() => {
    if (!publishedQuiz) return;

    if (publishedQuiz.quiz_key) {
      setPublishSettings((prev) => ({
        ...prev,
        secretKey: publishedQuiz.quiz_key,
        isSecretKeyRequired: !!publishedQuiz.quiz_key,
      }));
    }
  }, [publishedQuiz]);

  // Pagination calculations
  const totalPages = Math.ceil(localQuestions.length / QUESTIONS_PER_PAGE);
  const currentQuestions = useMemo(() => {
    const start = (currentPage - 1) * QUESTIONS_PER_PAGE;
    return localQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [localQuestions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [localQuestions.length]);

  // Save quiz to server
  const persistQuiz = useCallback(
    async (questions: QuizQuestion[]) => {
      if (!currentQuiz || !user || !companyInfo?.id) return;

      try {
        const token = await getToken();
        if (!token) throw new Error("No auth token");

        const payload = {
          role: currentQuiz.role,
          techStack: currentQuiz.techStack,
          experience: currentQuiz.experience,
          num_questions: questions.length,
          theory_questions_percentage: currentQuiz.theory_questions_percentage,
          code_analysis_questions_percentage: currentQuiz.code_analysis_questions_percentage,
          quiz: questions,
          is_publish: currentQuiz.is_publish,
          companyId: companyInfo?.id,
        };

        console.log("payload :", payload)
        console.log("Tech Stack :", currentQuiz.techStack)
        const res = await fetch(`/api/quiz/${encodeURIComponent(currentQuiz.quiz_id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Update failed (${res.status})`);
        }

        queryClient.invalidateQueries({ queryKey: ["quizzes", companyInfo?.id] });

        toast({
          title: "Saved",
          description: "Quiz updated successfully",
          className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
        });
      } catch (err: any) {
        console.error("Persist error:", err);
        toast({
          title: "Save failed",
          description: err.message || "Could not save quiz",
          variant: "destructive",
        });
      }
    },
    [currentQuiz, user, companyInfo, getToken, queryClient, toast]
  );

  // Publish handler
  const handlePublishConfirm = async (secretKey: string) => {
    console.log("Publishing quiz with companyInfo:", companyInfo);
    console.log("Quiz ID:", quizId);
    console.log("User:", user?.id);
    
    // Get company ID from multiple sources for fallback
    let companyId = companyInfo?.id;
    
    // If companyInfo is not available, try sessionStorage
    if (!companyId && typeof window !== 'undefined') {
      companyId = sessionStorage.getItem('company_id');
      console.log("Fallback to sessionStorage company_id:", companyId);
    }
    
    // If still not available, try localStorage
    if (!companyId && typeof window !== 'undefined') {
      companyId = localStorage.getItem('userCompanyId');
      console.log("Fallback to localStorage company_id:", companyId);
    }
    
    if (!quizId || !user || !companyId) {
      console.error("Missing required data for publishing:", { quizId, user: !!user, companyId });
      return;
    }

    setIsPublishing(true);

    try {
      const publicLink = `${origin}/${companyId}/take/quiz/${quizId}`;

      const updatedSettings = {
        ...publishSettings,
        secretKey: secretKey.trim(),
        isSecretKeyRequired: secretKey.trim().length > 0,
      };
      setPublishSettings(updatedSettings);

      const payload = {
  quiz_id: quizId,
  companyId: companyId,
  role: currentQuiz?.role ?? "",
  tech_stack: Array.isArray(currentQuiz?.techStack) 
    ? currentQuiz.techStack 
    : typeof currentQuiz?.techStack === 'string'
      ? JSON.parse(currentQuiz.techStack)
      : [],
  experience: currentQuiz?.experience ?? "1-3",
  questions: localQuestions,
  publicLink,
  secretKey: updatedSettings.secretKey,
  timeLimit: updatedSettings.timeLimit,
  maxAttempts: updatedSettings.maxAttempts,
  expirationDate: updatedSettings.expirationDate,
};

      const res = await fetch("/api/quiz/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Publish failed");
      }

      const result = await res.json();

      setPublicUrl(result.publicUrl || publicLink);
      setIsPublished(true);
      setIsPublishModalOpen(false);
      setIsShareModalOpen(true);

      queryClient.invalidateQueries({ queryKey: ["publishedQuiz", quizId] });
      queryClient.invalidateQueries({ queryKey: ["quizzes", companyInfo?.id] });

      toast({
        title: "Published!",
        description: "Your quiz is now live.",
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });
    } catch (err: any) {
      console.error("Publish error:", err);
      toast({
        title: "Publish failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Add / Edit question
  const handleSaveQuestion = async (data: QuestionFormData) => {
    const newQuestion: QuizQuestion = {
      id: data.id ?? Date.now().toString(),
      type: data.type,
      question: data.question,
      code_snippet: data.type === "code_analysis" ? data.code_snippet : null,
      options: { ...data.options },
      correct_answer: data.correct_answer,
    };

    const updated = [...localQuestions];
    if (editIndex === null) {
      updated.push(newQuestion);
    } else {
      updated[editIndex] = newQuestion;
    }

    setLocalQuestions(updated);
    setIsModalOpen(false);
    setEditIndex(null);
    await persistQuiz(updated);
  };

  // Delete question
  const handleDeleteQuestion = async () => {
    if (questionToDelete === null) return;
    const updated = localQuestions.filter((_, i) => i !== questionToDelete);
    setLocalQuestions(updated);
    await persistQuiz(updated);

    setIsDeleteQuestionDialogOpen(false);
    setQuestionToDelete(null);

    toast({
      title: "Deleted",
      description: "Question removed successfully",
      className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
    });
  };

  // Delete entire quiz
  const handleDeleteQuiz = async () => {
    if (!currentQuiz || !user || !companyInfo?.id) return;

    setIsPublishing(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      // Add companyId as query parameter for DELETE request
      const res = await fetch(
        `/api/quiz/${encodeURIComponent(currentQuiz.quiz_id)}?companyId=${encodeURIComponent(companyInfo?.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            'x-company-id': companyInfo?.id // Also add as header for redundancy
          },
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete quiz");

      // If quiz is published, clean up from publish service
      if (isPublished) {
        await fetch(
          `/api/publish/${companyInfo?.id}/${currentQuiz.quiz_id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        ).catch((e) => console.warn("Publish cleanup failed:", e));
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["quizzes", companyInfo?.id] });

      toast({
        title: "Deleted",
        description: "Quiz removed successfully",
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });

      // Redirect to quizzes list
      router.push("/dashboard/my-quizzes");
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message || "Could not delete quiz",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Copy link
  const handleCopyLink = useCallback(async () => {
    if (!quizId || !companyInfo?.id) return;
    const url = `${origin}/${companyInfo?.id}/quiz/${quizId}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Quiz link copied to clipboard",
      className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
    });
  }, [origin, quizId, companyInfo]);

  // FIXED: Open modal for editing with proper data population
  const handleOpenEditModal = (index: number) => {
    const question = localQuestions[index];
    setEditIndex(index);
    setFormData({
      id: question.id,
      type: question.type,
      question: question.question,
      code_snippet: question.code_snippet || "",
      options: {
        A: question.options?.A || "",
        B: question.options?.B || "",
        C: question.options?.C || "",
        D: question.options?.D || ""
      },
      correct_answer: ['A', 'B', 'C', 'D'].includes(question.correct_answer)
        ? question.correct_answer as 'A' | 'B' | 'C' | 'D'
        : 'A', // Default to 'A' if invalid
    });
    setIsModalOpen(true);
  };

  // FIXED: Open modal for adding new question with reset data
  const handleOpenAddModal = () => {
    setEditIndex(null);
    setFormData({
      type: "theory",
      question: "",
      code_snippet: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_answer: "A",
    });
    setIsModalOpen(true);
  };

  if (!isUserLoaded || isCompanyLoading || isQuizzesLoading || (currentQuiz?.is_publish && isLoadingPublished)) {
    return <PageLoading fullScreen />;
  }

  if (quizzesError) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300">
        Failed to load quiz: {quizzesError instanceof Error ? quizzesError.message : "Unknown error"}
      </div>
    );
  }

  if (!currentQuiz) {
    return <div className="text-center py-10 text-gray-400">Quiz not found</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-3 sm:px-4 pb-12">
      <QuizHeader
        quiz={publishedQuiz || currentQuiz}
        questionsCount={localQuestions.length}
        onAddQuestion={handleOpenAddModal}
        onPublish={() => setIsPublishModalOpen(true)}
        isPublished={isPublished}
        onDelete={() => setIsDeleteDialogOpen(true)}
        settings={publishSettings}
        onCopyLink={handleCopyLink}
        quizId={quizId || ""}
      />

      <section className="space-y-6">
        {currentQuestions.length > 0 ? (
          currentQuestions.map((q, pageIndex) => {
            const globalIndex = (currentPage - 1) * QUESTIONS_PER_PAGE + pageIndex;
            return (
              <QuestionCard
                key={q.id}
                question={q}
                questionNumber={globalIndex + 1}
                onEdit={() => handleOpenEditModal(globalIndex)}
                onDelete={() => {
                  setQuestionToDelete(globalIndex);
                  setIsDeleteQuestionDialogOpen(true);
                }}
                isPublished={isPublished}
              />
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-400">No questions yet. Add your first one!</div>
        )}
      </section>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalQuestions={localQuestions.length}
          questionsPerPage={QUESTIONS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      <QuestionForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditIndex(null);
        }}
        onSubmit={handleSaveQuestion}
        initialData={formData}
      />

      <ShareQuizModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizLink={(() => {
          let companyId = companyInfo?.id;
          if (!companyId && typeof window !== 'undefined') {
            companyId = sessionStorage.getItem('company_id') || localStorage.getItem('userCompanyId');
          }
          return companyId ? `${origin}/${companyId}/take/quiz/${quizId}` : "";
        })()}
        quizKey={publishedQuiz?.quiz_key || publishSettings.secretKey || currentQuiz?.quiz_key || ""}
      />

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishConfirm}
        quizId={quizId || ""}
        settings={publishSettings}
        onSettingsChange={setPublishSettings}
        isPublishing={isPublishing}
        origin={origin}
        onCopyLink={handleCopyLink}
        quizPublicLink={publicUrl}
        isPublished={isPublished}
        companyId={companyInfo?.id}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteQuiz}
        title="Delete Quiz"
        description="This will permanently delete the quiz and cannot be undone."
        confirmText="Delete Quiz"
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={isDeleteQuestionDialogOpen}
        onClose={() => {
          setIsDeleteQuestionDialogOpen(false);
          setQuestionToDelete(null);
        }}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        description="This action cannot be undone."
        confirmText="Delete Question"
        variant="destructive"
      />
    </div>
  );
}