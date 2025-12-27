'use client';
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

interface CompanyInfo {
  id: string;
  name: string;
  owner_email?: string;
}

interface UseCreateQuizReturn {
  // Form state
  role: string;
  setRole: (role: string) => void;
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
  
  // Company state
  companyInfo: CompanyInfo | null;
  isLoadingCompany: boolean;
  
  handleGenerate: (
    techStack: Array<{ name: string; weight: number }>,
    codePercentage?: number,
    role?: string
  ) => Promise<void>;
}

// Encapsulates all state and behavior for CreateQuiz workflow
export function useCreateQuiz(): UseCreateQuizReturn {
  // form state
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Bachelors");
  const [count, setCount] = useState(5);
  const [balance, setBalance] = useState<number[]>([50]);

  // request and UX state
  const [isReasoning, setIsReasoning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | ReactNode | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  
  // Company state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  // typing steps
  const steps = [
    "🔍 Parsing and understanding the role semantics...",
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

  // auth
  const { user, isLoaded } = useUser();

  // Fetch company info on mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!isLoaded || !user) {
        setIsLoadingCompany(false);
        return;
      }
      
      try {
        console.log('Fetching company info for user:', user.id);
        const response = await fetch(`/api/company/check?owner_id=${user.id}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Company check failed:', response.status, errorText);
          throw new Error(`Failed to fetch company information: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Company check response:', data);
        
        if (data.exists && data.companies && data.companies.length > 0) {
          const company = data.companies[0];
          console.log('Using company:', company);
          
          setCompanyInfo({
            id: company.company_id || company.id || company.name,
            name: company.name || company.company_id || 'Company',
            owner_email: company.owner_email || user?.emailAddresses?.[0]?.emailAddress
          });
        } else {
          console.warn('No company found for user');
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    };
    
    fetchCompanyInfo();
  }, [isLoaded, user]);

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
  
  // Memoize the completeGeneration function
  const safeCompleteGeneration = useCallback((success: boolean, data?: any) => {
    if (quizGeneration?.completeGeneration) {
      quizGeneration.completeGeneration(success, data);
    } else {
      console.warn('completeGeneration function is not available');
    }
  }, [quizGeneration]);

  // API call + animation toggles
  const handleGenerate = useCallback(async (
  techStack: Array<{name: string; weight: number }> = [],
  codePercentage: number = 50,
  role: string = ''
): Promise<void> => {
  if (isReasoning || isFetching) return;
  const numQuestions = Number.isFinite(count) ? Math.max(1, count) : 1;
  
  if (!role.trim()) {
    setError("Role is required");
    return;
  }
  
  if (!techStack || techStack.length === 0) {
    setError("At least one technology is required in the tech stack");
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
  try {
    // Prepare the payload with tech stack and role
    const codePct = Math.max(0, Math.min(100, codePercentage));
    const payload = {
      role: role.trim(),  // Using role as the role
      difficulty: difficultyToApi(difficulty),
      num_questions: numQuestions,
      theory_questions_percentage: 100 - codePct,
      code_analysis_questions_percentage: codePct,
      user_id: user?.id,
      timestamp: Date.now(),
      tech_stack: techStack.map(tech => ({
        name: tech.name,
        weight: tech.weight
      }))
    };

      console.log('Sending quiz generation request:', payload);
      
      // Build the API URL with companyId if available
      const apiUrl = `/api/quizzes${companyInfo?.id ? `?companyId=${encodeURIComponent(companyInfo.id)}` : ''}`;
      
      // Make a single API call to generate and save the quiz
      const response = await fetch(apiUrl, {
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
        // Handle role-related errors
        if (responseData.error.includes('not related to software')) {
          const roleError: TopicError = {
            error: responseData.error,
            message: '',
            suggestions: [
              'Programming languages (e.g., Python, JavaScript, Java)',
              'Web development (e.g., React, Node.js, CSS)',
              'Databases (e.g., SQL, MongoDB, PostgreSQL)'
            ],
            isTopicError: true
          };
          
          setError(roleError.message);
          safeCompleteGeneration(false, roleError);
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
  }, [isReasoning, isFetching, count, role, difficulty, balance, quizGeneration, user?.id, safeCompleteGeneration, companyInfo]);

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
    role,
    setRole,
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
    
    // company state
    companyInfo,
    isLoadingCompany,
    
    // actions
    handleGenerate,
  };
}