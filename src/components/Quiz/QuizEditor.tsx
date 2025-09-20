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
import { ShareQuizModal } from "./ShareQuizModal";
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
      
      // Update isPublished state when quiz data is loaded
      if (quiz.is_publish !== undefined) {
        setIsPublished(quiz.is_publish);
      }
      
      // Update isPublished state when quiz data changes
      if (quiz.is_publish !== undefined) {
        setIsPublished(quiz.is_publish);
      }
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

  // Fetch published quiz data if the quiz is published
  const { data: publishedQuiz, isLoading: isLoadingPublished } = useQuery({
    queryKey: ['publishedQuiz', quizId],
    queryFn: async () => {
      if (!quiz?.is_publish || !quizId || !user?.id) return null;
      
      try {
        console.log('Fetching published quiz data...');
        const response = await fetch(`/api/publish/${user.id}/${quizId}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch published quiz data:', response.status, errorText);
          throw new Error('Failed to fetch published quiz data');
        }
        const result = await response.json();
        console.log('Published quiz API response:', JSON.stringify(result, null, 2));
        return result.data;
      } catch (error) {
        console.error('Error fetching published quiz:', error);
        return null;
      }
    },
    enabled: !!quiz?.is_publish && !!quizId && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update local questions and publish settings when published quiz data is loaded
  useEffect(() => {
    if (publishedQuiz) {
      console.log('Updating local state with published quiz data:', publishedQuiz);
      
      // Update questions if available
      if (publishedQuiz.quiz) {
        setLocalQuestions(publishedQuiz.quiz);
      }
      
      // Update publish settings with the published quiz key if available
      if (publishedQuiz.quiz_key) {
        console.log('Updating publish settings with quiz key:', publishedQuiz.quiz_key);
        setPublishSettings(prev => ({
          ...prev,
          secretKey: publishedQuiz.quiz_key,
          isSecretKeyRequired: !!publishedQuiz.quiz_key
        }));
      }
    }
  }, [publishedQuiz]);

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
        is_publish: quiz.is_publish
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
        className: "border-green-500/40 bg-green-600/20 text-green-100",
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

  // Handle successful publish
  const handlePublishSuccess = (result: any) => {
    setIsPublished(true);
    setPublicUrl(result.publicUrl || '');
    setIsPublishModalOpen(false);
    setIsShareModalOpen(true);
    
    // Invalidate the published quiz query to refetch the latest data
    if (quizId) {
      queryClient.invalidateQueries({ queryKey: ['publishedQuiz', quizId] });
    }
  };

  // Handle publish confirmation
  const handlePublishConfirm = async (secretKey: string) => {
    if (!quizId || !user?.id) return;
    
    setIsPublishing(true);
    
    try {
      const publicLink = `${origin}/${slug}/take/quiz/${quizId}`;
      const updatedSettings = {
        ...publishSettings,
        secretKey: secretKey.trim(),
        isSecretKeyRequired: secretKey.trim().length > 0
      };
      setPublishSettings(updatedSettings);
      
      console.log('Publishing quiz with settings:', {
        quizId,
        settings: updatedSettings,
        publicLink,
        slug,
        topic: quiz?.topic,
        difficulty: quiz?.difficulty,
        timeLimit: updatedSettings.timeLimit,
        maxAttempts: updatedSettings.maxAttempts,
        expirationDate: updatedSettings.expirationDate,
        secretKey: updatedSettings.secretKey
      });
      
      const response = await fetch('/api/quiz/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
          settings: updatedSettings,
          questions: localQuestions,
          publicLink,
          slug: slug,
          topic: quiz?.topic,
          difficulty: quiz?.difficulty,
          timeLimit: updatedSettings.timeLimit,
          maxAttempts: updatedSettings.maxAttempts,
          expirationDate: updatedSettings.expirationDate,
          secretKey: updatedSettings.secretKey
        }),
      });

      const result = await response.json();
      console.log('Publish API response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to publish quiz');
      }

      handlePublishSuccess(result);
      
      toast({
        title: 'Success!',
        description: 'Your quiz has been published successfully.',
        className: 'bg-green-500/20 text-green-300',
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
      setIsPublishing(false);
    }
  };

  // Handle publish button click
  const handlePublish = () => {
    setIsPublishModalOpen(true);
  };

  // Handle copy link
  const handleCopyLink = async () => {
    if (!quizId || !user?.id) return;
    
    const url = `${origin}/${slug}/take/quiz/${quizId}`;
    await navigator.clipboard.writeText(url);
    
    toast({
      title: 'Link copied!',
      description: 'Quiz link has been copied to clipboard.',
      className: 'bg-green-500/20 text-green-300',
    });
  };

  // Get the quiz key to show in the share modal
  const quizKeyForShare = useMemo(() => {
    // First check if we have a published quiz with a key
    if (publishedQuiz?.quiz_key) {
      console.log('Using quiz key from published quiz:', publishedQuiz.quiz_key);
      return publishedQuiz.quiz_key;
    }
    
    // Fall back to the key from publish settings
    if (publishSettings.secretKey) {
      console.log('Using quiz key from publish settings:', publishSettings.secretKey);
      return publishSettings.secretKey;
    }
    
    // Fall back to the key from the quiz data
    if (quiz?.quiz_key) {
      console.log('Using quiz key from quiz data:', quiz.quiz_key);
      return quiz.quiz_key;
    }
    
    console.log('No quiz key found');
    return '';
  }, [publishedQuiz, publishSettings.secretKey, quiz?.quiz_key]);

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
  if (!isLoaded || rqLoading || (quiz?.is_publish && isLoadingPublished)) {
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
  if (!quiz || (quiz.is_publish && !publishedQuiz && !isLoadingPublished)) {
    return <div className="text-white/70">Quiz not found.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-3 sm:px-4">
      {/* Quiz Header */}
      <QuizHeader
        quiz={publishedQuiz || quiz}
        questionsCount={publishedQuiz?.quiz?.length || localQuestions.length}
        onAddQuestion={openAddModal}
        onPublish={handlePublish}
        isPublished={isPublished}
        onDelete={() => setIsDeleteDialogOpen(true)}
        settings={publishSettings}
        onCopyLink={handleCopyLink}
        quizId={quizId || ''}
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

      {/* Share Quiz Modal */}
      <ShareQuizModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizLink={`${origin}/${slug}/take/quiz/${quizId}`}
        quizKey={quizKeyForShare}
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
