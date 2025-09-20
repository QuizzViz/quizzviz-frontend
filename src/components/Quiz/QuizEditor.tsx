import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { QuizHeader } from "./QuizHeader";
import { QuestionCard } from "./QuestionCard";
import { Pagination } from "./Pagination";
import { QuestionForm } from "./QuestionForm";
import { PublishModal } from "./PublishModal";
import { 
  QuizSummary, 
  QuizQuestion, 
  PublishSettings,
  QuestionFormData
} from "./types";

const QUESTIONS_PER_PAGE = 10;

export function QuizEditor() {
  const router = useRouter();
  const { quizId } = router.query as { quizId?: string };
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const slug = (user?.firstName as string).trim().replace(" ", "").toLowerCase();
  
  
  // State
  const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [origin, setOrigin] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    secretKey: "",
    timeLimit: 30,
    maxAttempts: 1,
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isSecretKeyRequired: true
  });
  const [formData, setFormData] = useState<QuestionFormData>({
    type: "theory",
    question: "",
    code_snippet: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "A",
  });

  // Fetch quizzes data
  const { data: quizzesData, isLoading: rqLoading, error: rqError } = useQuery<QuizSummary[]>({
    queryKey: ["quizzes", user?.id],
    enabled: Boolean(isLoaded && user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/quizzes?userId=${encodeURIComponent(user!.id)}`);
      if (!res.ok) throw new Error((await res.text()) || `Failed to fetch quizzes (${res.status})`);
      return res.json();
    },
    staleTime: Infinity,
  });

  // Set origin on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Update local questions when data is loaded
  useEffect(() => {
    if (!quizzesData || !quizId) return;
    
    const quiz = quizzesData.find(q => q.quiz_id === quizId);
    if (!quiz) return;
    
    try {
      let questionsData: any[] = [];
      
      if (Array.isArray(quiz.quiz)) {
        questionsData = quiz.quiz;
      } else if (typeof quiz.quiz === 'string') {
        const parsed = JSON.parse(quiz.quiz);
        questionsData = Array.isArray(parsed) ? parsed : [];
      }
      
      const formattedQuestions = questionsData.map((q, index) => ({
        id: q.id || `q-${index}`,
        type: q.type || 'theory',
        question: q.question || 'No question text',
        code_snippet: q.code_snippet || null,
        options: q.options || { A: '', B: '', C: '', D: '' },
        correct_answer: q.correct_answer || 'A',
        ...q
      }));
      
      setLocalQuestions(formattedQuestions);
    } catch (e) {
      console.error('Error parsing quiz questions:', e);
      setLocalQuestions([]);
    }
  }, [quizzesData, quizId]);

  // Get current quiz
  const quiz = useMemo(() => {
    if (!quizzesData || !quizId) return undefined;
    return quizzesData.find(q => q.quiz_id === quizId);
  }, [quizzesData, quizId]);

  // Get current page questions
  const currentQuestions = useMemo(() => {
    const indexOfLastQuestion = currentPage * QUESTIONS_PER_PAGE;
    const indexOfFirstQuestion = indexOfLastQuestion - QUESTIONS_PER_PAGE;
    return localQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  }, [localQuestions, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(localQuestions.length / QUESTIONS_PER_PAGE);

  // Reset to first page when questions change
  useEffect(() => {
    setCurrentPage(1);
  }, [localQuestions.length]);

  // Persist quiz to the server
  const persistQuiz = async (questions: QuizQuestion[]) => {
    if (!quiz || !user) return;

    try {
      const payload = {
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        num_questions: questions.length,
        theory_questions_percentage: quiz.theory_questions_percentage,
        code_analysis_questions_percentage: quiz.code_analysis_questions_percentage,
        quiz: questions,
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

      await queryClient.invalidateQueries({ queryKey: ["quizzes", user.id] });
      
      toast({
        title: "Saved",
        description: "Quiz updated successfully",
        className: "border-blue-500/40 bg-blue-700 text-blue-100",
      });

      return await res.json();
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

  // Handle form submission
  const handleSaveQuestion = async (data: QuestionFormData) => {
    const newQuestion: QuizQuestion = {
      id: data.id ?? Date.now(),
      type: data.type,
      question: data.question,
      code_snippet: data.type === "code_analysis" && data.code_snippet ? data.code_snippet : null,
      options: { ...data.options },
      correct_answer: data.correct_answer,
    };

    const updatedQuestions = [...localQuestions];
    if (editIndex === null) {
      updatedQuestions.push(newQuestion);
    } else {
      updatedQuestions[editIndex] = newQuestion;
    }
    
    setLocalQuestions(updatedQuestions);
    setIsModalOpen(false);
    await persistQuiz(updatedQuestions);
  };

  // Handle question deletion
  const handleDeleteQuestion = async (index: number) => {
    const updatedQuestions = localQuestions.filter((_, i) => i !== index);
    setLocalQuestions(updatedQuestions);
    await persistQuiz(updatedQuestions);
    
    toast({
      title: "Question removed",
      description: "The question has been deleted from the quiz.",
      className: "border-red-500/40 bg-red-600 text-red-100",
    });
  };

  // Handle quiz deletion
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

      await queryClient.invalidateQueries({ queryKey: ["quizzes", user.id] });
      
      toast({
        title: "Deleted",
        description: "Quiz has been deleted",
        className: "border-red-500/40 bg-red-600 text-red-100",
      });

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

  // Handle publish
  const handlePublish = async () => {
    if (isPublished) {
      // Copy public URL to clipboard
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: 'Link copied!',
        description: 'The quiz link has been copied to your clipboard.',
        variant: 'default',
      });
      return;
    }
    setIsPublishModalOpen(true);
  };

  // Handle publish confirmation
  const handlePublishConfirm = async (secretKey: string = '') => {
    if (!quizId || !user) return;

    setIsPublishing(true);

    try {
      const publicLink = `${origin}/quiz/${(user.firstName as string).trim().replace(' ', '').toLowerCase()}/${quizId}`;
      
      // Update publishSettings with the latest secretKey
      const updatedSettings = {
        ...publishSettings,
        secretKey: secretKey.trim(),
        isSecretKeyRequired: secretKey.trim().length > 0
      };
      setPublishSettings(updatedSettings);
      
      const response = await fetch('/api/quiz/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: quizId,
          settings: updatedSettings,
          questions: localQuestions,
          publicLink,
          slug: (user.firstName as string).trim().replace(' ', '').toLowerCase(),
          topic: quiz?.topic,
          difficulty: quiz?.difficulty,
          timeLimit: updatedSettings.timeLimit,
          maxAttempts: updatedSettings.maxAttempts,
          expirationDate: updatedSettings.expirationDate,
          secretKey: updatedSettings.secretKey || ''
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to publish quiz');
      }

      setIsPublished(true);
      setPublicUrl(result.publicUrl || '');
      
      setIsPublishModalOpen(false);
      toast({
        title: 'Success!',
        description: result.message || 'Your quiz is now live and ready to be shared.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'There was an error publishing your quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle copy link
  const handleCopyLink = () => {
    const quizLink = `${origin}/${slug}/take/quiz/${quiz?.quiz_id}`;
    navigator.clipboard.writeText(quizLink);
    
    toast({
      title: "Link copied to clipboard!",
      description: "Share this link with your participants.",
      className: "border-green-500/40 bg-green-600/20 text-green-100",
    });
  };

  // Open add question modal
  const openAddModal = () => {
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

  // Open edit question modal
  const openEditModal = (index: number) => {
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
        D: question.options?.D || "",
      },
      correct_answer: (question.correct_answer as "A" | "B" | "C" | "D") || "A",
    });
    setIsModalOpen(true);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Show loading state
  if (!isLoaded || rqLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (rqError) {
    return (
      <div className="border border-red-500/40 text-red-300 rounded-lg p-4">
        {rqError instanceof Error ? rqError.message : 'An error occurred while loading the quiz.'}
      </div>
    );
  }

  // Show not found state
  if (!quiz) {
    return <div className="text-white/70">Quiz not found.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-3 sm:px-4">
      {/* Quiz Header */}
      <QuizHeader
        quiz={quiz}
        questionsCount={localQuestions.length}
        onAddQuestion={openAddModal}
        onPublish={handlePublish}
        isPublished={isPublished}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      {/* Questions List */}
      <section className="space-y-6">
        {currentQuestions.length > 0 ? (
          currentQuestions.map((question, index) => {
            const globalQuestionNumber = (currentPage - 1) * QUESTIONS_PER_PAGE + index + 1;
            return (
              <QuestionCard
                key={question.id ?? index}
                question={question}
                questionNumber={globalQuestionNumber}
                onEdit={() => openEditModal((currentPage - 1) * QUESTIONS_PER_PAGE + index)}
                onDelete={() => {
                  const globalIndex = (currentPage - 1) * QUESTIONS_PER_PAGE + index;
                  handleDeleteQuestion(globalIndex);
                }}
              />
            );
          })
        ) : (
          <div className="text-white/70">No questions available for this quiz.</div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalQuestions={localQuestions.length}
            questionsPerPage={QUESTIONS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Question Form Modal */}
      <QuestionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveQuestion}
        initialData={formData}
      />

      {/* Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishConfirm}
        quizId={quizId || ''}
        settings={publishSettings}
        onSettingsChange={setPublishSettings}
        isPublishing={isPublishing}
        origin={origin}
        onCopyLink={handleCopyLink}
        isPublished={isPublished}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteQuiz}
        title="Delete Quiz"
        description="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmText="Delete Quiz"
        variant="destructive"
      />
    </div>
  );
}
