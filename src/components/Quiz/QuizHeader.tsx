import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizSummary } from "./types";

interface QuizHeaderProps {
  quiz: QuizSummary | undefined;
  questionsCount: number;
  onAddQuestion: () => void;
  onPublish: () => void;
  isPublished: boolean;
  onDelete: () => void;
}

export function QuizHeader({ 
  quiz, 
  questionsCount, 
  onAddQuestion, 
  onPublish, 
  isPublished,
  onDelete 
}: QuizHeaderProps) {
  if (!quiz) return null;

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
          <Button 
            className={`${isPublished ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white pointer-events-auto`}
            onClick={onPublish}
          >
            {isPublished ? 'Copy Quiz Link' : 'Publish Quiz'}
          </Button>
          <Button 
            variant="destructive" 
            className="pointer-events-auto hover:bg-red-700" 
            onClick={onDelete}
          >
            Delete Quiz
          </Button>
        </div>
      </div>
    </header>
  );
}
