import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizSummary, PublishSettings } from "./types";
import { Share2, EyeOff } from "lucide-react";
import { useState } from "react";
import { ShareQuizModal } from "./ShareQuizModal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import {useCompanies} from "@/hooks/useCompanies";
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
  const { toast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const {company} = useCompanies(user?.id);
  if (!quiz) return null;

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleUnpublishClick = async () => {
    try {
      setIsUnpublishing(true);
      
      // Use PUT to update the quiz status and handle unpublishing
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_publish: false,
          companyId: company?.company_id
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to unpublish quiz: ${error}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Quiz unpublished successfully",
          className: 'cursor-pointer border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
        });
        // Refresh the page to show the unpublished state
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to unpublish quiz');
      }
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred while unpublishing the quiz',
        variant: "destructive",
      });
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
            {quiz.role} Quiz
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
                className="bg-blue-600 hover:bg-blue-700 text-white pointer-events-auto"
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
        quizLink={`${window.location.origin}/${company?.company_id}/take/quiz/${quizId}`}
        quizKey={settings?.secretKey || ''}
      />
      
      <ConfirmationDialog
        isOpen={isUnpublishModalOpen}
        onClose={() => setIsUnpublishModalOpen(false)}
        onConfirm={handleUnpublishClick}
        title="Unpublish Quiz"
        description="Are you sure you want to unpublish this quiz? The quiz will no longer be accessible to others."
        confirmText={isUnpublishing ? 'Unpublishing...' : 'Yes, Unpublish'}
        variant="default"
      />
    </header>
  );
}
