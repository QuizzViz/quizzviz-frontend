import { useEffect, useState, useCallback } from "react";
import { Cpu, Code, Sparkles, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuizGeneration } from "@/contexts/QuizGenerationContext";

// Encapsulates all state and behavior for CreateQuiz workflow
export function useCreateQuiz() {
  // form state
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Bachelors");
  const [count, setCount] = useState(5);
  const [balance, setBalance] = useState<number[]>([50]);

  // request and UX state
  const [isReasoning, setIsReasoning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const { startGeneration, completeGeneration } = useQuizGeneration();

  // API call + animation toggles
  const handleGenerate = useCallback(async (): Promise<any> => {
    if (isReasoning || isFetching) return;

    const numQuestions = Number.isFinite(count) ? Math.max(1, count) : 1;
    if (!topic.trim()) return setError("Topic is required");
    if (!difficulty) return setError("Difficulty is required");
    if (!numQuestions) return setError("Number of questions is required");

    // Start the global loading state
    startGeneration(topic.trim());
    
    // Reset local state
    setError(null);
    setQuizData(null);
    setIsReasoning(true);
    setIsFetching(true);
    setStepIndex(0);
    setCharIndex(0);
    setTypedText("");
    setProgress(0);

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
    try {
      // Make a single API call to generate and save the quiz
      const response = await fetch(`/api/quizzes?userId=${encodeURIComponent(user?.id || '')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      if (!response.ok) {
        let errorText = 'Failed to generate quiz';
        try {
          const errorData = JSON.parse(responseText);
          errorText = errorData.error || errorData.message || errorText;
          if (errorData.details) {
            errorText += ` (${errorData.details})`;
          }
          console.error('API Error:', errorData);
        } catch (e) {
          errorText = responseText || errorText;
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorText);
      }
      
      let savedQuiz;
      try {
        savedQuiz = JSON.parse(responseText);
        console.log('Parsed quiz response:', savedQuiz);
      } catch (e) {
        console.error('Failed to parse quiz response:', e);
        throw new Error('Invalid response format from server');
      }
      
      // Ensure the quiz has the expected structure
      if (!savedQuiz.quiz_id && savedQuiz.id) {
        savedQuiz.quiz_id = savedQuiz.id;
      }
      
      // Transform the response to match the expected format
      const formattedQuiz = {
        ...savedQuiz,
        questions: savedQuiz.quiz || savedQuiz.questions || []
      };
      
      if (!formattedQuiz.questions || !Array.isArray(formattedQuiz.questions)) {
        console.error('Invalid questions format in response:', formattedQuiz);
        throw new Error('Quiz data does not contain valid questions');
      }
      
      setQuizData(formattedQuiz);
      completeGeneration(true, formattedQuiz);
      return formattedQuiz;
    } catch (e: any) {
      console.error("Error generating quiz:", e);
      const errorMessage = e?.message || "Failed to generate quiz. Please try again.";
      setError(errorMessage);
      completeGeneration(false);
      throw e;
    } finally {
      setIsFetching(false);
      setTimeout(() => setIsReasoning(false), 400);
    }
  }, [isReasoning, isFetching, count, topic, difficulty, balance, startGeneration, completeGeneration, user?.id]);

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
  const { setGenerationProgress } = useQuizGeneration();
  
  // Update global progress when local progress changes
  useEffect(() => {
    if (isReasoning) {
      const progressValue = Math.min(99, Math.max(0, progress)); // Cap at 99% until complete
      setGenerationProgress(progressValue);
    }
  }, [progress, isReasoning, setGenerationProgress]);

  return {
    // state
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    count,
    setCount,
    balance,
    setBalance,
    isReasoning,
    isFetching,
    error,
    setError,
    quizData,
    setQuizData,
    // progress
    steps,
    stepIcons,
    stepIndex,
    typedText,
    progress,
    // actions
    handleGenerate,
  };
}
