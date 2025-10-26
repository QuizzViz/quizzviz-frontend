import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizSummary, PublishSettings } from "./types";
import { Share2, EyeOff } from "lucide-react";
import { useState } from "react";
import { ShareQuizModal } from "./ShareQuizModal";
import { UnpublishQuizModal } from "./UnpublishQuizModal";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface QuizHeaderProps {
  quiz: QuizSummary | undefined;
  questionsCount: number;
  onAddQuestion: () => void;
  onPublish: () => void;
  isPublished: boolean;
  onDelete: () => void;
  settings: PublishSettings;
  onCopyLink: () => void;
  quizId: string;
}

export function QuizHeader({ 
  quiz, 
  questionsCount, 
  onAddQuestion, 
  onPublish, 
  isPublished,
  onDelete,
  settings,
  onCopyLink,
  quizId
}: QuizHeaderProps) {
  const { user } = useUser();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  
  if (!quiz) return null;

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleUnpublishClick = async () => {
    try {
      setIsUnpublishing(true);
      
      // First, get the current quiz data
      const getResponse = await fetch(`/api/quiz/${quizId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!getResponse.ok) {
        const error = await getResponse.text();
        throw new Error(`Failed to fetch quiz data: ${error}`);
      }

      const currentQuizData = await getResponse.json();
      
      // Prepare the update data with all required fields
      const updateData = {
        topic: currentQuizData.topic || '',
        difficulty: currentQuizData.difficulty || 'High School Level',
        num_questions: currentQuizData.questions?.length || 0,
        theory_questions_percentage: currentQuizData.theory_questions_percentage || 50,
        code_analysis_questions_percentage: currentQuizData.code_analysis_questions_percentage || 50,
        quiz: currentQuizData.questions || [],
        is_publish: false,  // Update only this field
        quiz_time: currentQuizData.quiz_time || 1800,
        quiz_expiration_time: currentQuizData.quiz_expiration_time || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_attempts: currentQuizData.max_attempts,
        quiz_key: currentQuizData.quiz_key || ''
      };
      
      // Update only the is_publish status while preserving all other data
      const updateResponse = await fetch(`/api/quiz/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        throw new Error(`Failed to update quiz status: ${error}`);
      }

      // Then delete from publish service
      const publishResponse = await fetch(`/api/publish/${user?.id}/${quizId}`, {
        method: 'DELETE',
      });
      
      if (publishResponse.ok) {
        toast.success('Quiz unpublished successfully');
        // Refresh the page to show the unpublished state
        window.location.reload();
      } else {
        const error = await publishResponse.text();
        throw new Error(`Failed to unpublish quiz: ${error}`);
      }
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while unpublishing the quiz');
    } finally {
      setIsUnpublishing(false);
      setIsUnpublishModalOpen(false);
    }
  };

  return (
    <header className="space-y-2">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {quiz.topic} Quiz
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <Badge variant="secondary">{quiz.difficulty}</Badge>
            <span>• {questionsCount} questions</span>
            <span>• Theory {quiz.theory_questions_percentage}%</span>
            <span>• Code {quiz.code_analysis_questions_percentage}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap relative z-10 pointer-events-auto">
          {!isPublished && (
            <Button 
              variant="outline" 
              className="pointer-events-auto" 
              onClick={onAddQuestion}
            >
              Add Question
            </Button>
          )}
          {isPublished ? (
            <>
              <Button 
                variant="outline"
                className="text-white border-white/20 hover:bg-zinc-800 pointer-events-auto"
                onClick={() => setIsUnpublishModalOpen(true)}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Unpublish Quiz
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white pointer-events-auto"
                onClick={handleShareClick}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Quiz
              </Button>
            </>
          ) : (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white pointer-events-auto"
              onClick={onPublish}
            >
              Publish Quiz
            </Button>
          )}
          <Button 
            variant="destructive" 
            className="pointer-events-auto hover:bg-red-700" 
            onClick={onDelete}
          >
            Delete Quiz
          </Button>
        </div>
      </div>
      
      {/* Share Quiz Modal */}
      <ShareQuizModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizLink={`${window.location.origin}/${(user?.firstName?.trim().toLowerCase().replace(/\s+/g, ''))}/take/quiz/${quizId}`}
        quizKey={settings?.secretKey || ''}
      />
      
      <UnpublishQuizModal
        isOpen={isUnpublishModalOpen}
        onClose={() => setIsUnpublishModalOpen(false)}
        onConfirm={handleUnpublishClick}
        isLoading={isUnpublishing}
      />
    </header>
  );
}
