import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QuizQuestion } from "./types";

interface QuestionCardProps {
  question: QuizQuestion;
  questionNumber: number;
  onEdit: () => void;
  onDelete: () => void;
  isPublished?: boolean;
}

export function QuestionCard({ question, questionNumber, onEdit, onDelete, isPublished = false }: QuestionCardProps) {
  return (
    <Card className="bg-zinc-950 border-white/10">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white">{questionNumber}.</span>
            <Badge className="ml-2">{question.type.replace(/_/g, " ")}</Badge>
          </div>
          {!isPublished && (
            <div className="flex items-center gap-2 flex-wrap relative z-10 pointer-events-auto">
              <Button size="sm" className="pointer-events-auto hover:bg-blue-700" onClick={onEdit}>
                Update
              </Button>
              <Button 
                size="sm" 
                className="pointer-events-auto hover:bg-red-700" 
                variant="destructive" 
                onClick={onDelete}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap leading-relaxed text-white">{question.question}</p>
        {question.code_snippet && (
          <pre className="overflow-x-auto rounded-md bg-zinc-900/80 p-4 text-sm text-zinc-200 border border-white/10">
            <code>{question.code_snippet}</code>
          </pre>
        )}

        {question.options && (
          <div className="space-y-2">
            <h4 className="font-medium text-white">Options</h4>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(question.options).map(([key, val]) => (
                <li
                  key={key}
                  className={`rounded-md border p-3 text-white ${
                    key === question.correct_answer 
                      ? "border-green-600 bg-green-900/20" 
                      : "border-white/10 bg-zinc-900/40"
                  }`}
                >
                  <span className="font-semibold mr-2">{key}.</span>
                  <span className="text-sm whitespace-pre-wrap">{val}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
