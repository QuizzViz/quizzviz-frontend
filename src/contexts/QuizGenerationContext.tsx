import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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

  const startGeneration = (topic: string) => {
    setIsGenerating(true);
    setCurrentTopic(topic);
    setGenerationProgress(0);
    localStorage.setItem('quizGenerationState', JSON.stringify({
      isGenerating: true,
      topic,
      timestamp: Date.now()
    }));
  };

  const completeGeneration = (success: boolean, quizData?: any) => {
    setIsGenerating(false);
    setGenerationProgress(0);
    localStorage.removeItem('quizGenerationState');

    if (success && quizData) {
      // Invalidate cached quizzes so My Quizzes updates instantly
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });

      const go = () => router.push("/dashboard/my-quizzes");
      toast({
        title: "Quiz generated",
        description: `${quizData?.topic || currentTopic || 'Your quiz'} is ready. Click to view in My Quizzes.`,
        duration: 15000,
        onClick: go,
        className: "cursor-pointer border-blue-600/60 bg-blue-700/30 text-blue-100 shadow-lg shadow-blue-600/30",
        action: (
          <button
            onClick={go}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-500/60 bg-transparent hover:bg-blue-600/25 h-10 px-4 py-2 text-blue-100"
          >
            View
          </button>
        ),
      });
    } else if (!success) {
      toast({
        title: "Quiz generation failed",
        description: "There was an error generating your quiz. Please try again.",
        variant: "destructive",
      });
    }
    
    setCurrentTopic(null);
  };

  return (
    <QuizGenerationContext.Provider
      value={{
        isGenerating,
        generationProgress,
        setGenerationProgress,
        startGeneration,
        completeGeneration,
        currentTopic,
      }}
    >
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
