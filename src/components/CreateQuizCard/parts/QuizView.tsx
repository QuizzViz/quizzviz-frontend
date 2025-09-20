import { FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PublishQuizModal } from "./PublishQuizModal";
import { useToast } from "@/hooks/use-toast";
import { Share2, CheckCircle } from "lucide-react";

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
    publicLink: string;
  }) => {
    setIsPublishing(true);
    try {
      const response = await fetch('/api/quiz/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: data?.id || 'new-quiz',
          settings: {
            secretKey: settings.secretKey,
            timeLimit: settings.timeLimit,
            maxAttempts: settings.maxAttempts,
            expirationDate: settings.expirationDate,
          },
          questions: data?.quiz || [],
          publicLink: settings.publicLink,
          topic: data?.topic || 'General Knowledge',
          difficulty: data?.difficulty || 'Medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish quiz');
      }
      
      const result = await response.json();
      
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
        description: error instanceof Error ? error.message : "Failed to publish quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (!data?.public_link) return;
    
    navigator.clipboard.writeText(data.public_link);
    toast({
      title: "Link copied to clipboard!",
      description: "Share this link with others to take the quiz.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {data?.is_publish ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 flex items-center gap-2"
                onClick={handleCopyLink}
              >
                <Share2 className="h-4 w-4" />
                Share Quiz
              </Button>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium px-2 py-1 rounded-md bg-green-50 border border-green-100">
                <CheckCircle className="h-4 w-4" />
                <span>Published</span>
              </div>
            </div>
          ) : (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsPublishModalOpen(true)}
            >
              Publish Quiz
            </Button>
          )}
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
