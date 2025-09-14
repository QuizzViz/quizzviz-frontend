import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';

interface QuizGenerationContextType {
  isGenerating: boolean;
  generationProgress: number;
  setGenerationProgress: (progress: number) => void;
  startGeneration: (topic: string) => void;
  completeGeneration: (success: boolean, quizData?: any) => void;
  currentTopic: string | null;
}

const QuizGenerationContext = createContext<QuizGenerationContextType | undefined>(undefined);

export function QuizGenerationProvider({ children }: { children: ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgressState] = useState(0);
  
  // Memoize the setter to prevent unnecessary re-renders
  const setGenerationProgress = useCallback((progress: number) => {
    setGenerationProgressState(Math.max(0, Math.min(100, progress)));
  }, []);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  useEffect(() => {
    // Check for existing generation state on mount
    const savedState = localStorage.getItem('quizGenerationState');
    if (savedState) {
      const { isGenerating: savedIsGenerating, topic, timestamp } = JSON.parse(savedState);
      // Only restore if it was started recently (within last 10 minutes)
      if (savedIsGenerating && Date.now() - timestamp < 10 * 60 * 1000) {
        setIsGenerating(true);
        setCurrentTopic(topic);
      } else {
        localStorage.removeItem('quizGenerationState');
      }
    }
  }, []);

  const startGeneration = useCallback((topic: string) => {
    setIsGenerating(true);
    setCurrentTopic(topic);
    setGenerationProgress(0);
    localStorage.setItem('quizGenerationState', JSON.stringify({
      isGenerating: true,
      topic,
      timestamp: Date.now()
    }));    
  }, []);

  const completeGeneration = useCallback(async (success: boolean, data?: any) => {
    try {
      setIsGenerating(false);
      setCurrentTopic(null);
      setGenerationProgress(0);
      localStorage.removeItem('quizGenerationState');

      // Only handle errors here, no success notifications
      if (!success) {
        // For topic-related errors, show a more detailed message
        if (data?.isTopicError) {
          toast({
            title: data.error || 'Invalid Topic',
            description: (
              <div className="space-y-2">
                <p>{data.message}</p>
                {data.suggestions && data.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Suggested topics:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {data.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
            variant: 'destructive',
            duration: 15000,
            className: 'text-left max-w-lg',
          });
        } else {
          // For other errors
          toast({
            title: 'Error Generating Quiz',
            description: `${data?.message || 'Failed to generate quiz.'} Please try a topic from the software industry.`,
            variant: 'destructive',
            duration: 10000,
          });
        }
        return;
      }

      // If successful, just invalidate the queries
      if (data?.quiz_id) {
        await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      }
    } catch (error) {
      console.error('Error in completeGeneration:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }, [queryClient, router, toast]);

  const contextValue = useMemo(() => ({
    isGenerating,
    generationProgress,
    setGenerationProgress,
    startGeneration,
    completeGeneration,
    currentTopic,
  }), [isGenerating, generationProgress, startGeneration, completeGeneration, currentTopic]);

  return (
    <QuizGenerationContext.Provider value={contextValue}>
      {children}
    </QuizGenerationContext.Provider>
  );
}

export function useQuizGeneration() {
  const context = useContext(QuizGenerationContext);
  if (context === undefined) {
    throw new Error('useQuizGeneration must be used within a QuizGenerationProvider');
  }
  return context;
}
