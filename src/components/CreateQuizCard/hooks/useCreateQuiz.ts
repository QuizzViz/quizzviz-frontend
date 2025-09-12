import { useEffect, useState } from "react";
import { Cpu, Code, Sparkles, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";

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

  // API call + animation toggles
  const handleGenerate = async () => {
    if (isReasoning || isFetching) return;

    const numQuestions = Number.isFinite(count) ? Math.max(1, count) : 1;
    if (!topic.trim()) return setError("Topic is required");
    if (!difficulty) return setError("Difficulty is required");
    if (!numQuestions) return setError("Number of questions is required");

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
      difficulty_level: difficultyToApi(difficulty),
      num_questions: numQuestions,
      theory_questions_percentage: 100 - codePct,
      code_analysis_questions_percentage: codePct,
      user_id: user?.id
    };

    try {
      const resp = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error((await resp.text()) || `Request failed with status ${resp.status}`);
      const data = await resp.json();
      setQuizData(data);
    } catch (e: any) {
      console.error("Error generating quiz:", e);
      setError(e?.message || "Failed to generate quiz. Please try again.");
    } finally {
      setIsFetching(false);
      setTimeout(() => setIsReasoning(false), 400);
    }
  };

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
