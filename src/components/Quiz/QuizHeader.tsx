import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizSummary, PublishSettings } from "./types";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { ShareQuizModal } from "./ShareQuizModal";
import { useUser } from "@clerk/nextjs";

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
  
  if (!quiz) return null;

  const handleShareClick = () => {
    setIsShareModalOpen(true);
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
          <Button 
            variant="outline" 
            className="pointer-events-auto" 
            onClick={onAddQuestion}
          >
            Add Question
          </Button>
          {isPublished ? (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white pointer-events-auto"
              onClick={handleShareClick}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Quiz
            </Button>
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
        quizLink={`${window.location.origin}/${(user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')}/take/quiz/${quizId}`}
        quizKey={settings?.secretKey || ''}
      />
    </header>
  );
}
