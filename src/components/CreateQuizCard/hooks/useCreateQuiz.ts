import { useEffect, useState, useCallback, ReactNode } from "react";
import { Cpu, Code, Sparkles, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuizGeneration } from "@/contexts/QuizGenerationContext";

interface TopicError {
  error: string;
  message: string;
  suggestions?: string[];
  isTopicError?: boolean;
  details?: string;
}

interface UseCreateQuizReturn {
  // Form state
  topic: string;
  setTopic: (topic: string) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
  count: number;
  setCount: (count: number) => void;
  balance: number[];
  setBalance: (balance: number[]) => void;
  
  // Request state
  isReasoning: boolean;
  isFetching: boolean;
  error: string | ReactNode | null;
  setError: (error: string | ReactNode | null) => void;
  quizData: any;
  setQuizData: (data: any) => void;
  
  // Progress state
  steps: string[];
  stepIcons: any[];
  stepIndex: number;
  typedText: string;
  progress: number;
  
  // Actions
  handleGenerate: () => Promise<void>;
}

// Encapsulates all state and behavior for CreateQuiz workflow
export function useCreateQuiz(): UseCreateQuizReturn {
  // form state
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Bachelors");
  const [count, setCount] = useState(5);
  const [balance, setBalance] = useState<number[]>([50]);

  // request and UX state
  const [isReasoning, setIsReasoning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | ReactNode | null>(null);
  const [quizData, setQuizData] = useState<any>(null);

  // typing steps
  const steps = [
    "🔍 Parsing and understanding the topic semantics...",
    "⚖️ Balancing code-analysis and theoretical coverage...",
    "🧩 Generating question templates & code scaffolds...",
    "✅ Validating difficulty and finalizing the quiz...",
  ];
  const stepIcons = [Cpu, Code, Sparkles, CheckCircle];

  const [stepIndex, setStepIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const TYPING_SPEED = 18;
  const HOLD_AFTER_TYPING = 900;
  const FINISH_HOLD = 600;

  // auth (must be called at hook top-level, not inside callbacks)
  const { user } = useUser();

  const difficultyToApi = (val: string) => {
    switch (val) {
      case "High School":
        return "High School Level";
      case "Bachelors":
        return "Bachelors Level";
      case "Masters":
        return "Masters Level";
      case "PhD":
        return "PhD Level";
      default:
        return "Bachelors Level";
    }
  };

  const quizGeneration = useQuizGeneration();
  
  // Memoize the completeGeneration function to prevent unnecessary re-renders
  const safeCompleteGeneration = useCallback((success: boolean, data?: any) => {
    if (quizGeneration?.completeGeneration) {
      quizGeneration.completeGeneration(success, data);
    } else {
      console.warn('completeGeneration function is not available');
    }
  }, [quizGeneration]);

  // API call + animation toggles
  const handleGenerate = useCallback(async (): Promise<void> => {
    if (isReasoning || isFetching) return;

    const numQuestions = Number.isFinite(count) ? Math.max(1, count) : 1;
    if (!topic.trim()) {
      setError("Topic is required");
      return;
    }
    if (!difficulty) {
      setError("Difficulty is required");
      return;
    }
    if (!numQuestions) {
      setError("Number of questions is required");
      return;
    }

    // Start the generation process
    setIsFetching(true);
    setIsReasoning(true);
    setError(null);
    setQuizData(null);
    
    // Notify other tabs that generation has started
    if (quizGeneration?.startGeneration) {
      quizGeneration.startGeneration(topic.trim());
    }

    try {
      // Prepare the payload
      const codePct = Math.max(0, Math.min(100, balance[0] ?? 50));
      const payload = {
        topic: topic.trim(),
        difficulty: difficultyToApi(difficulty),
        num_questions: numQuestions,
        theory_questions_percentage: 100 - codePct,
        code_analysis_questions_percentage: codePct,
        user_id: user?.id,
        timestamp: Date.now()
      };

      console.log('Sending quiz generation request:', payload);
      
      // Make a single API call to generate and save the quiz
      const response = await fetch(`/api/quizzes?userId=${encodeURIComponent(user?.id || '')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Parsed quiz response:', responseData);
      } catch (e) {
        console.error('Failed to parse quiz response:', e);
        throw new Error('Invalid response format from server');
      }

      // Check for error in successful response (200 but with error field)
      if (responseData.error) {
        // Handle topic-related errors
        if (responseData.error.includes('not related to software')) {
          const topicError: TopicError = {
            error: responseData.error || 'Invalid Topic',
            message: responseData.message || 'The topic is not related to software development.',
            suggestions: [
              'Programming languages (e.g., Python, JavaScript, Java)',
              'Web development (e.g., React, Node.js, CSS)',
              'Databases (e.g., SQL, MongoDB, PostgreSQL)'
            ],
            isTopicError: true
          };
          
          setError(topicError.message);
          safeCompleteGeneration(false, topicError);
          return;
        }
        
        // Handle other errors in successful response
        const errorMessage = responseData.message || responseData.error || 'Failed to generate quiz';
        setError(errorMessage);
        safeCompleteGeneration(false, { error: 'Error', message: errorMessage });
        return;
      }
      
      // Ensure the quiz has the expected structure
      if (!responseData.quiz_id && responseData.id) {
        responseData.quiz_id = responseData.id;
      }

      // If we get here, the response was successful and contains quiz data
      setQuizData(responseData);
      
      // Complete generation - this will show the success notification
      safeCompleteGeneration(true, responseData);
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz';
      setError(errorMessage);
      safeCompleteGeneration(false, { error: 'Error', message: errorMessage });
    } finally {
      setIsFetching(false);
      setTimeout(() => setIsReasoning(false), 400);
    }
  }, [isReasoning, isFetching, count, topic, difficulty, balance, quizGeneration, user?.id, safeCompleteGeneration]);

  // Typewriter effect and progress
  useEffect(() => {
    if (!isReasoning) return;

    let typingTimer: ReturnType<typeof setInterval> | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    if (stepIndex >= steps.length) {
      if (isFetching) {
        holdTimer = setTimeout(() => {
          setStepIndex(0);
          setTypedText("");
          setCharIndex(0);
        }, HOLD_AFTER_TYPING);
      } else {
        setProgress(100);
        holdTimer = setTimeout(() => {
          setIsReasoning(false);
          setStepIndex(0);
          setTypedText("");
          setCharIndex(0);
          setProgress(0);
        }, FINISH_HOLD);
      }
      return () => {
        if (typingTimer) clearInterval(typingTimer);
        if (holdTimer) clearTimeout(holdTimer);
      };
    }

    const current = steps[stepIndex];
    setTypedText("");
    setCharIndex(0);

    typingTimer = setInterval(() => {
      setCharIndex((prev) => {
        const next = prev + 1;
        if (next <= current.length) {
          const slice = current.slice(0, next);
          setTypedText(slice);
          const fraction = next / Math.max(1, current.length);
          const overall = ((stepIndex + fraction) / steps.length) * 100;
          setProgress(Math.min(100, Math.round(overall)));
          return next;
        } else {
          if (typingTimer) {
            clearInterval(typingTimer);
            typingTimer = null;
          }
          holdTimer = setTimeout(() => setStepIndex((s) => s + 1), HOLD_AFTER_TYPING);
          return prev;
        }
      });
    }, TYPING_SPEED);

    return () => {
      if (typingTimer) clearInterval(typingTimer);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [isReasoning, stepIndex, isFetching]);

  // Get the setGenerationProgress function from context
  const quizGenContext = useQuizGeneration();
  
  // Update global progress when local progress changes
  useEffect(() => {
    if (isReasoning && quizGenContext?.setGenerationProgress) {
      const progressValue = Math.min(99, Math.max(0, progress)); // Cap at 99% until complete
      quizGenContext.setGenerationProgress(progressValue);
    }
  }, [progress, isReasoning, quizGenContext]);

  return {
    // form state
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    count,
    setCount,
    balance,
    setBalance,
    
    // request state
    isReasoning,
    isFetching,
    error,
    setError,
    quizData,
    setQuizData,
    
    // progress state
    steps,
    stepIcons,
    stepIndex,
    typedText,
    progress,
    
    // actions
    handleGenerate,
  } as UseCreateQuizReturn;
}
