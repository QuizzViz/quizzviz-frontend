import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { PublishQuizModal } from "./PublishQuizModal";
import { useToast } from "@/hooks/use-toast";

// Renders the generated quiz list with a back action
const QuizView: FC<{
  data: any;
  onBack: () => void;
}> = ({ data, onBack }) => {
  const { toast } = useToast();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async (settings: {
    secretKey: string;
    timeLimit: number;
    maxAttempts: number;
    expirationDate: string;
  }) => {
    setIsPublishing(true);
    try {
      // TODO: Implement actual publish API call
      console.log('Publishing quiz with settings:', settings);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast({
        title: "Quiz Published!",
        description: "Your quiz is now live and can be accessed with the shared link.",
      });
      
      // Close the modal
      setIsPublishModalOpen(false);
    } catch (error) {
      console.error('Error publishing quiz:', error);
      toast({
        title: "Error",
        description: "Failed to publish quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Quiz</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            className="border-border" 
            onClick={onBack}
          >
            Back
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsPublishModalOpen(true)}
          >
            Publish Quiz
          </Button>
        </div>
      </div>

      {Array.isArray(data?.quiz) && data.quiz.length === 0 && (
        <div className="text-sm text-muted-foreground">No questions returned.</div>
      )}

      <div className="space-y-6">
        {Array.isArray(data?.quiz) &&
          data.quiz.map((q: any, idx: number) => (
            <div key={q.id ?? idx} className="border border-border rounded-xl p-4 bg-background">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-foreground font-medium">{q.question}</div>
                  {q.type === "code_analysis" && q.code_snippet && (
                    <div className="rounded-md overflow-hidden border border-border">
                      <div className="bg-[#0b0b0b] text-gray-200 font-mono text-sm p-4 overflow-x-auto">
                        <pre className="whitespace-pre leading-6">{`$ python\n${q.code_snippet}`}</pre>
                      </div>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {Object.entries(q.options || {}).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-foreground/30"
                      >
                        <input type="radio" name={`q-${idx}`} value={key} className="accent-foreground" required />
                        <span className="font-semibold">{key}.</span>
                        <span className="text-foreground/90">{String(value)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-end">
        <Button className="bg-foreground text-background" onClick={() => { /* TODO: submit */ }}>
          Submit
        </Button>
      </div>
      
      <PublishQuizModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        quizId={data?.id || 'new-quiz'}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />
    </div>
  );
};

export default QuizView
