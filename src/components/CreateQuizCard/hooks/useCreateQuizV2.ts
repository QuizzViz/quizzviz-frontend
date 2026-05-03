'use client';
import { useEffect, useState, useCallback, ReactNode } from "react";
import { Cpu, Code, Sparkles, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuizGeneration } from "@/contexts/QuizGenerationContext";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

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
  topic: string;
  setTopic: (topic: string) => void;
  experience: string;
  setExperience: (experience: string) => void;
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
  
  // Actions
  handleGenerate: (techStack: any[], codePercentage?: number, role?: string, uploadedFiles?: any[]) => Promise<void>;
}

// Encapsulates all state and behavior for CreateQuiz workflow
export function useCreateQuizV2(): UseCreateQuizReturn {
  // form state
  const [topic, setTopic] = useState("");
  const [experience, setExperience] = useState("1-3");
  const [count, setCount] = useState(5);
  const [balance, setBalance] = useState<number[]>([50]);

  // request and UX state
  const [isReasoning, setIsReasoning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | ReactNode | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  
  // Use the same logic as profile page
  const { companyInfo, isLoading: isLoadingCompany } = useCompanyInfo();

  // typing steps
  const steps = [
    " Parsing and understanding the topic semantics...",
    " Balancing code-analysis and theoretical coverage...",
    " Generating question templates & code scaffolds...",
    " Validating difficulty and finalizing the quiz...",
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

  const experienceToApi = (val: string) => {
    switch (val) {
      case "0-1":
        return "0-1";
      case "1-3":
        return "1-3";
      case "3-5":
        return "3-5";
      case "5+":
        return "5+";
      default:
        return "1-3";
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
    techStack: any[],
    codePercentage: number = 50,
    role?: string,
    uploadedFiles?: any[]
  ): Promise<void> => {
    if (isReasoning || isFetching) return;

    const numQuestions = Number.isFinite(count) ? Math.max(1, count) : 1;

    if (!role) {
      setError("Role is required");
      return;
    }
    if (!experience) {
      setError("Experience is required");
      return;
    }
    
    // If no files are uploaded, require tech stack
    if (!uploadedFiles || uploadedFiles.length === 0) {
      if (!techStack || !Array.isArray(techStack) || techStack.length === 0) {
        setError("At least one technology is required in the tech stack when no files are uploaded");
        return;
      }
    
      const validTechStack = techStack.filter(tech => 
        tech && 
        typeof tech === 'object' && 
        'name' in tech && 
        typeof tech.name === 'string' && 
        tech.name.trim() !== '' &&
        'weight' in tech && 
        typeof tech.weight === 'number' &&
        tech.weight > 0
      );
    
      if (validTechStack.length === 0) {
        setError("Please add at least one valid technology with a weight greater than 0");
        return;
      }
    }
    
    // Ensure we have a valid company ID
    const companyId = companyInfo?.id;
    if (!companyId) {
      setError("Company information is required. Please refresh the page and try again.");
      return;
    }
    
    // Validate company ID format
    if (typeof companyId !== 'string' || companyId.length < 10) {
      console.error('Invalid company ID detected:', companyId);
      setError("Invalid company ID. Please log out and log back in to refresh your session.");
      return;
    }
    
    // Update the balance state with the current code percentage
    setBalance([codePercentage]);

    // Start the generation process
    setIsFetching(true);
    setIsReasoning(true);
    setError(null);
    setQuizData(null);
    
    // Notify other tabs that generation has started
    if (quizGeneration?.startGeneration) {
      if (uploadedFiles && uploadedFiles.length > 0) {
        // For file uploads, show just the role like tech stack mode
        quizGeneration.startGeneration(role);
      } else {
        const validTechStack = techStack.filter(tech => 
          tech && 
          typeof tech === 'object' && 
          'name' in tech && 
          typeof tech.name === 'string' && 
          tech.name.trim() !== '' &&
          'weight' in tech && 
          typeof tech.weight === 'number' &&
          tech.weight > 0
        );
        quizGeneration.startGeneration(
          `${role} - ${validTechStack.map((t: any) => t.name).join(', ') || 'Tech Stack'}`
        );
      }
    }

    try {
      const codePct = Math.max(0, Math.min(100, codePercentage));
      let response: Response;
      
      // Use file upload endpoint if files are provided
      if (uploadedFiles && uploadedFiles.length > 0) {
        // Build FormData - backend will handle file reading
        const formData = new FormData();
        
        // Append all uploaded files
        uploadedFiles.forEach((uploadedFile, index) => {
          formData.append('files', uploadedFile.file);
        });
        formData.append('role', role);
        formData.append('experience', experienceToApi(experience));
        formData.append('num_questions', numQuestions.toString());
        formData.append('theory_questions_percentage', (100 - codePct).toString());
        formData.append('code_analysis_questions_percentage', codePct.toString());
        formData.append('is_publish', 'false');
        formData.append('is_deleted', 'false');
        formData.append('company_id', companyId);

        console.log('Sending file-based quiz generation request:', {
          role,
          experience: experienceToApi(experience),
          numQuestions,
          theoryQuestionsPercentage: 100 - codePct,
          codeAnalysisQuestionsPercentage: codePct,
          fileCount: uploadedFiles.length,
          fileNames: uploadedFiles.map(f => f.name),
          fileSizes: uploadedFiles.map(f => f.size),
        });
        
        response = await fetch('/api/quiz/file', {
          method: 'POST',
          // Do NOT set Content-Type header — browser sets it automatically
          // with the correct multipart boundary for FormData
          body: formData,
        });

      } else {
        // Use regular endpoint with tech stack
        const validTechStack = techStack.filter(tech => 
          tech && 
          typeof tech === 'object' && 
          'name' in tech && 
          typeof tech.name === 'string' && 
          tech.name.trim() !== '' &&
          'weight' in tech && 
          typeof tech.weight === 'number' &&
          tech.weight > 0
        );
        
        const payload = {
          experience: experienceToApi(experience),
          num_questions: numQuestions,
          theory_questions_percentage: 100 - codePct,
          code_analysis_questions_percentage: codePct,
          user_id: user?.id,
          role: role,
          timestamp: Date.now(),
          techStack: validTechStack.map(tech => ({
            name: tech.name.trim(),
            weight: Math.round(tech.weight)
          })),
          is_deleted: false,
          is_publish: false,
          company_id: companyId,
        };
        
        console.log('Sending quiz generation request:', JSON.stringify(payload, null, 2));
        
        response = await fetch('/api/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

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
        if (responseData.error.includes('not related to software')) {
          const topicError: TopicError = {
            error: responseData.error,
            message: '',
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
        
        const errorMessage = responseData.message || responseData.error || 'Failed to generate quiz';
        setError(errorMessage);
        safeCompleteGeneration(false, { error: 'Error', message: errorMessage });
        return;
      }
      
      // Normalise quiz_id field
      if (!responseData.quiz_id && responseData.id) {
        responseData.quiz_id = responseData.id;
      }

      setQuizData(responseData);
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
  }, [isReasoning, isFetching, count, topic, experience, balance, quizGeneration, user?.id, safeCompleteGeneration, companyInfo]);

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
      const progressValue = Math.min(99, Math.max(0, progress));
      quizGenContext.setGenerationProgress(progressValue);
    }
  }, [progress, isReasoning, quizGenContext]);

  return {
    // form state
    topic,
    setTopic,
    experience,
    setExperience,
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