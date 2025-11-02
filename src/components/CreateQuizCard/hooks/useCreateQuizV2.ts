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

interface UseCreateQuizReturnV2 {
  // Form state
  topic: string;
  setTopic: (topic: string) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
  count: number;
  setCount: (count: number) => void;
  
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
  handleGenerate: (codePercentage: number) => Promise<void>;
}

// Updated version of useCreateQuiz that properly handles codePercentage
export function useCreateQuizV2(): UseCreateQuizReturnV2 {
  // form state
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Bachelors Level");
  const [count, setCount] = useState(5);
  
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
  const quizGeneration = useQuizGeneration();

  const difficultyToApi = (val: string) => {
    // If the value already contains 'Level', return it as is
    if (val.includes('Level')) {
      return val;
    }
    
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

  // Memoize the completeGeneration function to prevent unnecessary re-renders
  const safeCompleteGeneration = useCallback((success: boolean, data?: any) => {
    if (quizGeneration?.completeGeneration) {
      quizGeneration.completeGeneration(success, data);
    } else {
      console.warn('completeGeneration function is not available');
    }
  }, [quizGeneration]);

  // API call + animation toggles
  const handleGenerate = useCallback(async (codePercentage: number): Promise<void> => {
    if (isReasoning || isFetching) return;

    const numQuestions = Number.isFinite(count) ? Math.max(1, count) : 1;
    
    // Ensure codePercentage is a valid number between 0 and 100
    const validatedCodePercentage = Math.max(0, Math.min(100, Number(codePercentage) || 50));
    const validatedTheoryPercentage = 100 - validatedCodePercentage;
    
    console.log('Generating quiz with:', {
      codePercentage: validatedCodePercentage,
      theoryPercentage: validatedTheoryPercentage,
      totalQuestions: numQuestions
    });
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
      // Log the values being sent to the API
      console.log('Sending to API:', {
        codePercentage: validatedCodePercentage,
        theoryPercentage: validatedTheoryPercentage,
        totalQuestions: numQuestions
      });

      // Prepare the payload with the validated percentages
      const payload = {
        topic: topic.trim(),
        difficulty: difficultyToApi(difficulty),
        num_questions: numQuestions,
        theory_questions_percentage: 100 - validatedCodePercentage, // Ensure they sum to 100
        code_analysis_questions_percentage: validatedCodePercentage,
        user_id: user?.id,
        timestamp: Date.now()
      };
      
      console.log('Quiz generation payload with percentages:', {
        codePercentage: validatedCodePercentage,
        theoryPercentage: validatedTheoryPercentage,
        totalQuestions: numQuestions
      });

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
            error: responseData.error,
            message: responseData.message ,
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
      safeCompleteGeneration(true, responseData);
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz';
      setError(errorMessage);
      safeCompleteGeneration(false, { error: 'Error', message: errorMessage });
    } finally {
      setIsFetching(false);
      setIsReasoning(false);
    }
  }, [topic, difficulty, count, user?.id, isReasoning, isFetching, quizGeneration, safeCompleteGeneration]);

  // Simulate typing effect for the reasoning panel
  useEffect(() => {
    if (!isReasoning) {
      setTypedText("");
      setCharIndex(0);
      setStepIndex(0);
      setProgress(0);
      return;
    }

    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    if (charIndex < currentStep.length) {
      const timeout = setTimeout(() => {
        setTypedText(currentStep.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
        
        // Update progress based on current step and characters typed
        const stepProgress = ((charIndex + 1) / currentStep.length) * (100 / steps.length);
        const totalProgress = (stepIndex * (100 / steps.length)) + stepProgress;
        setProgress(totalProgress);
      }, TYPING_SPEED);

      return () => clearTimeout(timeout);
    } else if (stepIndex < steps.length - 1) {
      const timeout = setTimeout(() => {
        setStepIndex(stepIndex + 1);
        setCharIndex(0);
      }, HOLD_AFTER_TYPING);

      return () => clearTimeout(timeout);
    } else if (!isFetching) {
      // If we're done with all steps and not fetching anymore, hold briefly before clearing
      const timeout = setTimeout(() => {
        setTypedText("");
        setCharIndex(0);
        setStepIndex(0);
      }, FINISH_HOLD);

      return () => clearTimeout(timeout);
    }
  }, [isReasoning, stepIndex, charIndex, isFetching, steps]);

  return {
    // Form state
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    count,
    setCount,
    
    // Request state
    isReasoning,
    isFetching,
    error,
    setError,
    quizData,
    setQuizData,
    
    // Progress state
    steps,
    stepIcons,
    stepIndex,
    typedText,
    progress,
    
    // Actions
    handleGenerate,
  };
}
