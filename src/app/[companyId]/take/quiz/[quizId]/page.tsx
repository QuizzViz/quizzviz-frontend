'use client';
import { use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, User, Mail, Key, ArrowRight, Home, Trophy, Target, CheckCircle, BookOpen, Timer, Shield, Zap, Lock, Eye, AlertTriangle, Maximize2, Monitor } from 'lucide-react';

import { toast } from "@/hooks/use-toast";
import { formatTime } from '@/lib/utils';
import { formatCompanyIdToName } from '@/utils/companyUtils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { usePlanLimitsByCompanyId } from '@/hooks/usePlanLimitsByCompanyId';
import { useCompanyUsageByCompanyId } from '@/hooks/useCompanyUsageByCompanyId';
import CameraProctoring from '@/components/Proctoring/CameraProctoring';

interface Question {
  id: string | number;
  type: 'theory' | 'code_analysis';
  question: string;
  code_snippet: string | null;
  options: Record<string, string>;
  correct_answer: string;
}

interface TechStackItem {
  name: string;
  weight: number;
}

interface QuizData {
  quiz_id: string;
  topic: string;
  experience: string;
  company_id: string;
  num_questions: number;
  quiz: Question[];
  quiz_key: string;
  quiz_time: number;
  quiz_expiration_time: string;
  max_attempts?: number;
  role: string;
  tech_stack?: TechStackItem[];
}

interface PageProps {
  params: Promise<{
    companyId: string;
    quizId: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

type FormData = {
  name: string;
  email: string;
  quizKey: string;
};

export default function QuizPage({ params }: PageProps) {
  const { companyId, quizId } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'instructions' | 'quiz-info' | 'quiz' | 'results'>('info');
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', quizKey: '' });
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  // Get company usage data for candidate limit checking (no auth required)
  const { data: usageData, isLoading: usageLoading } = useCompanyUsageByCompanyId(companyId);
  
  // Check plan limits based on companyId
  const currentUsage = {
    quizzesThisMonth: 0,
    totalCandidates: usageData?.current_month?.unique_candidates || 0,
    teamMembers: 0
  };
  
  const { 
    isCandidateLimitReached, 
    candidateLimit, 
    currentCandidates,
    candidatesRemaining 
  } = usePlanLimitsByCompanyId(companyId, currentUsage);

  // Shuffle options for Enterprise plan quizzes
  const shuffleOptions = useCallback((question: Question): Question => {
    if (question.type === 'code_analysis') {
      const options = { ...question.options };
      const entries = Object.entries(options);
      const questionKey = entries.find(([_, value]) => value === question.question)?.[0];
      let shuffledEntries = [...entries];

      if (questionKey) {
        const questionEntry = shuffledEntries.find(([key]) => key === questionKey);
        shuffledEntries = shuffledEntries.filter(([key]) => key !== questionKey);
        for (let i = shuffledEntries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledEntries[i], shuffledEntries[j]] = [shuffledEntries[j], shuffledEntries[i]];
        }
        if (questionEntry) shuffledEntries = [questionEntry, ...shuffledEntries];
      } else {
        for (let i = shuffledEntries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledEntries[i], shuffledEntries[j]] = [shuffledEntries[j], shuffledEntries[i]];
        }
      }
      return { ...question, options: Object.fromEntries(shuffledEntries) };
    }
    return question;
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [warnings, setWarnings] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── NEW: separate flag so CameraProctoring only begins detection after quiz starts
  const [proctoringStarted, setProctoringStarted] = useState(false);

  const [attemptsInfo, setAttemptsInfo] = useState<{ current: number; max: number }>({ current: 0, max: 1 });
  const [showingMaxAttemptsNotification, setShowingMaxAttemptsNotification] = useState(false);

  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const activityMonitorRef = useRef({
    lastActivity: Date.now(),
    warnings: 0,
    mouseX: 0,
    mouseY: 0,
    lastMouseMove: Date.now(),
    lastKeyPress: Date.now()
  });
  const exitConfirmationRef = useRef(false);
  const hasSubmittedRef = useRef(false);

  // Fetch initial quiz data from publish service
  useEffect(() => {
    const fetchInitialQuizData = async () => {
      try {
        const currentPath = `${window.location.origin}/${companyId}/take/quiz/${quizId}`;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PUBLISH_QUIZZ_SERVICE_URL}/publish/public/quiz/${encodeURIComponent(currentPath)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.quiz) {
            const shuffledQuiz = { ...data, quiz: shuffleArray([...data.quiz]) };
            setQuizData(shuffledQuiz);
            setTimeLeft(data.quiz_time * 60);
            const maxAttempts = data.max_attempts || 1;
            setAttemptsInfo({ current: 0, max: maxAttempts });
          }
        }
      } catch (error) {
        console.error('Error fetching initial quiz data:', error);
      }
    };

    fetchInitialQuizData();
  }, [companyId, quizId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkUserAttempts = useCallback(async (showToast = true): Promise<boolean> => {
    if (showingMaxAttemptsNotification) return false;
    if (!formData?.name || !formData?.email) {
      setIsButtonLoading(false);
      return false;
    }
    try {
      const response = await fetch(
        `/api/quiz_result/check-attempt/email/${encodeURIComponent(formData.email)}/quiz/${quizId}?company_id=${encodeURIComponent(companyId)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to check attempts');
      }
      const data = await response.json();
      const maxAttempts = quizData?.max_attempts || 1;
      const currentAttempt = data.attempts || 0;
      const hasReachedMax = currentAttempt >= maxAttempts;
      setAttemptsInfo({ current: currentAttempt, max: maxAttempts });
      if (hasReachedMax && showToast) {
        setShowingMaxAttemptsNotification(true);
        toast({
          variant: 'destructive',
          title: 'Maximum attempts reached!',
          description: `You've used ${currentAttempt} of ${maxAttempts} attempts.`,
          duration: 5000,
          className: 'font-medium'
        });
        setTimeout(() => setShowingMaxAttemptsNotification(false), 5000);
      }
      return !hasReachedMax;
    } catch (error) {
      console.error('Error checking attempts:', error);
      return false;
    }
  }, [showingMaxAttemptsNotification, formData, quizId, quizData?.max_attempts]);

  const submitQuiz = useCallback(async (answers: Record<number, string>): Promise<boolean> => {
    if (hasSubmittedRef.current) {
      console.log('Quiz already submitted, skipping duplicate submission...');
      return true;
    }
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    if (!quizData || !formData) {
      console.error('Quiz data or form data is missing');
      return false;
    }

    try {
      const allAnswers: Record<number, string> = {};
      quizData.quiz.forEach((_, index) => {
        allAnswers[index] = answers[index] ?? '';
      });
      setSelectedAnswers(allAnswers);

      let correct = 0;
      const total = quizData.quiz.length;
      const userAnswers = quizData.quiz.map((question, index) => {
        const answer = allAnswers[index] || '';
        const isCorrect = answer === question.correct_answer;
        if (isCorrect) correct++;
        return {
          question_id: question.id.toString(),
          user_answer: answer,
          is_correct: isCorrect,
          correct_answer: question.correct_answer
        };
      });

      const percentage = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;

      const submissionData = {
        quiz_id: quizData.quiz_id,
        company_id: companyId,
        username: formData.name,
        user_email: formData.email,
        user_answers: userAnswers,
        result: {
          score: percentage,
          total_questions: total,
          correct_answers: correct,
          role: quizData.role,
          quiz_experience: quizData.experience,
          time_taken: Math.max(1, Math.ceil((quizData.quiz_time * 60 - timeLeft) / 60))
        },
        attempt: attemptsInfo ? attemptsInfo.current + 1 : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch('/api/quiz_result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to submit quiz results');
      }

      setAttemptsInfo(prev => ({ current: prev ? prev.current + 1 : 1, max: prev?.max || 1 }));
      return true;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return false;
    } finally {
      setIsSubmitting(false);
      setStep('results');
    }
  }, [quizData, formData, attemptsInfo, timeLeft, companyId]);

  const getCurrentAnswer = useCallback((questionIndex: number) => {
    return selectedAnswers[questionIndex] !== undefined ? selectedAnswers[questionIndex] : '';
  }, [selectedAnswers]);

  const requestFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.error('Fullscreen error:', err);
      setIsFullscreen(false);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(console.error);
    else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
  }, []);

  const showWarningMessage = useCallback((message: string) => {
    setWarnings(prev => prev + 1);
    setShowWarning(true);
    window.focus();
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setShowWarning(false), 5000);
  }, []);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const exitConfirmResolve = useRef<((value: boolean) => void) | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const confirmExit = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      exitConfirmResolve.current = resolve;
      setShowExitConfirm(true);
    });
  }, []);

  const handleExitResponse = useCallback((confirmed: boolean) => {
    if (exitConfirmResolve.current) {
      exitConfirmResolve.current(confirmed);
      exitConfirmResolve.current = null;
    }
    setShowExitConfirm(false);
    if (confirmed) {
      setSelectedAnswers(currentAnswers => { submitQuiz(currentAnswers); return currentAnswers; });
    } else {
      const quizContent = document.getElementById('quiz-content');
      if (quizContent) quizContent.focus();
    }
  }, [submitQuiz]);

  const isSubmittingRef = useRef(false);

  // ── Proctoring handlers — NO quiz termination on camera init failure ──────────
  const handleProctoringViolation = useCallback((message: string) => {
    console.log('Proctoring violation:', message);
    showWarningMessage(`Proctoring: ${message}`);
    // Intentionally NOT showing a toast every violation – the on-screen widget shows it
  }, [showWarningMessage]);

  // Only called by CameraProctoring when a hard violation (>15s or multiple faces) fires
  const handleProctoringEnd = useCallback((reason: string) => {
    console.log('Proctoring ended:', reason);
    if (hasSubmittedRef.current) return;

    toast({
      variant: 'destructive',
      title: 'Quiz Terminated',
      description: `Quiz ended due to: ${reason}`,
      duration: 5000,
      className: 'font-medium'
    });

    setSelectedAnswers(currentAnswers => { submitQuiz(currentAnswers); return currentAnswers; });
  }, [submitQuiz]);

  const handleFullscreenChange = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (exitConfirmationRef.current || !quizStarted || isRestoring) return;

    const isFS = document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement;

    if (!isFS) {
      exitConfirmationRef.current = true;
      try {
        const scrollY = window.scrollY;
        const currentAnswers = { ...selectedAnswers };
        const userConfirmed = await confirmExit();
        if (userConfirmed) {
          isSubmittingRef.current = true;
          await submitQuiz(currentAnswers);
          return;
        } else {
          setIsRestoring(true);
          let fullscreenRestored = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await requestFullscreen();
              await new Promise(resolve => setTimeout(resolve, 100));
              window.scrollTo(0, scrollY);
              document.body.offsetHeight;
              fullscreenRestored = true;
              break;
            } catch (err) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          if (!fullscreenRestored) {
            isSubmittingRef.current = true;
            alert('Could not restore fullscreen mode. The quiz will now end.');
            await submitQuiz(currentAnswers);
            return;
          }
        }
      } finally {
        setIsRestoring(false);
        setTimeout(() => { exitConfirmationRef.current = false; }, 1000);
      }
    }
  }, [quizStarted, requestFullscreen, submitQuiz, selectedAnswers, confirmExit, isRestoring]);

  useEffect(() => {
    if (step === 'quiz' && quizStarted) {
      const enterFullscreen = async () => {
        try {
          await requestFullscreen();
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) { e.preventDefault(); requestFullscreen(); }
          });
        } catch (err) { console.error('Fullscreen error:', err); }
      };
      enterFullscreen();

      const handleVisibilityChange = () => {
        if (document.hidden && !hasSubmittedRef.current) {
          activityMonitorRef.current.warnings = 1;
          showWarningMessage('Quiz terminated due to tab switch!');
          toast({
            variant: 'destructive',
            title: 'Quiz Terminated',
            description: 'The quiz has been terminated due to a violation of the test rules.',
            duration: 5000,
            className: 'font-medium'
          });
          setSelectedAnswers(currentAnswers => { submitQuiz(currentAnswers); return currentAnswers; });
        } else if (!document.hidden) {
          requestFullscreen();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault(); e.stopPropagation();
          showWarningMessage('Escape key is disabled during the quiz!');
          return false;
        }
        const forbiddenKeys = [
          'F12', 'F11',
          ...(e.ctrlKey ? ['r', 'R', 'u', 'U', 'Shift'] : []),
          ...(e.ctrlKey && e.shiftKey ? ['i', 'I', 'j', 'J', 'c', 'C'] : [])
        ];
        if (forbiddenKeys.includes(e.key) ||
          (e.ctrlKey && e.key.toLowerCase() === 'r') ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') ||
          (e.ctrlKey && e.key.toLowerCase() === 'u')) {
          e.preventDefault(); e.stopPropagation(); return false;
        }
      };

      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 || e.clientX <= 0 ||
          e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
          showWarningMessage('Please keep your mouse within the quiz window!');
        }
      };

      const blockEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault(); e.stopPropagation();
          showWarningMessage('Escape key is disabled during the quiz!');
          return false;
        }
      };

      document.addEventListener('keydown', blockEscapeKey, true);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);
      document.addEventListener('mouseleave', handleMouseLeave);

      document.onkeydown = function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault(); e.stopPropagation();
          showWarningMessage('Escape key is disabled during the quiz!');
          return false;
        }
        if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
          (e.ctrlKey && ['U', 'u'].includes(e.key))) {
          e.preventDefault(); return false;
        }
      };

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) { e.preventDefault(); e.stopPropagation(); }
      }, true);

      document.addEventListener('selectstart', (e) => { e.preventDefault(); return false; });
      document.addEventListener('copy', (e) => { e.preventDefault(); return false; });

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your quiz progress will be lost.';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      const checkFullscreen = setInterval(() => {
        const isFS = document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement;
        if (!isFS && quizStarted && !exitConfirmationRef.current && !hasSubmittedRef.current) {
          exitConfirmationRef.current = true;
          setShowExitConfirm(true);
          setSelectedAnswers(currentAnswers => { submitQuiz(currentAnswers); return currentAnswers; });
        }
      }, 1000);

      const devToolsCheck = setInterval(() => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        if (widthThreshold || heightThreshold) {
          showWarningMessage('Developer tools are not allowed during the quiz!');
          window.dispatchEvent(new Event('resize'));
          document.body.innerHTML = '';
          window.location.reload();
        }
      }, 1000);

      const mobileCheckInterval = setInterval(() => {
        if (hasSubmittedRef.current) return;
        
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobileDevice) {
          toast({
            variant: 'destructive',
            title: 'Quiz Terminated',
            description: 'Mobile device detected during quiz. Quiz ended immediately.',
            duration: 5000,
            className: 'font-medium',
          });
          
          setSelectedAnswers(currentAnswers => {
            submitQuiz(currentAnswers);
            return currentAnswers;
          });
        }
      }, 5000); // Check every 5 seconds

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('selectstart', () => {});
        document.removeEventListener('copy', () => {});
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('keydown', blockEscapeKey, true);
        clearInterval(checkFullscreen);
        clearInterval(devToolsCheck);
        clearInterval(mobileCheckInterval);
      };
    }
  }, [step, quizStarted, requestFullscreen, showWarningMessage, handleFullscreenChange, submitQuiz]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const calculateResults = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    const total = quizData.quiz.length;
    Object.entries(selectedAnswers).forEach(([index, answer]) => {
      const question = quizData.quiz[parseInt(index)];
      if (question && answer === question.correct_answer) correct++;
    });
    const percentage = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;
    return { correct, total, percentage };
  };

  const verifyQuizKey = async (): Promise<boolean> => {
    if (!formData.quizKey.trim()) { setVerificationError('Please enter a quiz key'); return false; }
    try {
      setVerifying(true);
      setVerificationError('');
      const currentPath = window.location.href;
      const apiUrl = new URL(
        `/api/verify-quiz?quizUrl=${encodeURIComponent(currentPath)}&key=${encodeURIComponent(formData.quizKey)}`,
        window.location.origin
      );
      const response = await fetch(apiUrl.toString(), { method: 'GET', headers: { 'accept': 'application/json' } });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to verify quiz key');
      }
      const data = await response.json();
      if (!data || !data.quiz_key) throw new Error('Invalid response from server');
      if (data.quiz_key !== formData.quizKey) throw new Error('Invalid quiz key. Please check and try again.');
      if (!data.quiz || !Array.isArray(data.quiz)) throw new Error('Invalid quiz data received');

      const shuffledQuiz = { ...data, quiz: shuffleArray([...data.quiz]) };
      setQuizData(shuffledQuiz);
      setTimeLeft(data.quiz_time * 60);

      const maxAttempts = data.max_attempts || 1;
      setAttemptsInfo({ current: 0, max: maxAttempts });

      const canProceed = await checkUserAttemptsAfterLoad(maxAttempts);
      if (!canProceed) return false;

      setStep('instructions');
      return true;
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify quiz key';
      setVerificationError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const checkUserAttemptsAfterLoad = async (maxAttempts: number): Promise<boolean> => {
    if (!formData?.name || !formData?.email) return false;
    try {
      const response = await fetch(
        `/api/quiz_result/check-attempt/email/${encodeURIComponent(formData.email)}/quiz/${quizId}?company_id=${encodeURIComponent(companyId)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to check attempts');
      }
      const data = await response.json();
      const currentAttempt = data.attempts || 0;
      const hasReachedMax = currentAttempt >= maxAttempts;
      setAttemptsInfo({ current: currentAttempt, max: maxAttempts });
      if (hasReachedMax) {
        toast({
          variant: "destructive",
          title: "Maximum attempts reached!",
          description: `You've used ${currentAttempt} of ${maxAttempts} attempts.`,
          duration: 5000,
          className: 'font-medium',
        });
      }
      return !hasReachedMax;
    } catch (error) {
      console.error('Error checking attempts:', error);
      return false;
    }
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check candidate limit before proceeding
    if (isCandidateLimitReached) {
      toast({
        variant: 'destructive',
        title: 'Candidate Limit Reached',
        description: `The number of candidates for this quiz has reached the plan limit (${currentCandidates}/${candidateLimit}). Please contact your administrator.`,
        duration: 5000,
        className: 'font-medium'
      });
      return;
    }
    
    await verifyQuizKey();
  };

  const startQuiz = () => { setStep('quiz-info'); };

  const beginQuiz = useCallback(async () => {
    if (isButtonLoading) return;
    setIsButtonLoading(true);
    try {
      if (attemptsInfo.current >= attemptsInfo.max) {
        setIsButtonLoading(false);
        toast({
          variant: 'destructive',
          title: 'Maximum attempts reached!',
          description: `You've used ${attemptsInfo.current} of ${attemptsInfo.max} attempts.`,
          duration: 5000,
          className: 'font-medium',
        });
        return;
      }
      const hasAttemptsLeft = await checkUserAttempts(true);
      if (!hasAttemptsLeft) { setIsButtonLoading(false); return; }

      setQuizStarted(true);
      setStep('quiz');

      // Mobile device detection - immediately end quiz if mobile is detected
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        toast({
          variant: 'destructive',
          title: 'Quiz Terminated',
          description: 'Mobile devices are not allowed for proctored quizzes.',
          duration: 5000,
          className: 'font-medium',
        });
        
        // Submit quiz immediately due to mobile detection
        setSelectedAnswers(currentAnswers => {
          submitQuiz(currentAnswers);
          return currentAnswers;
        });
        setIsButtonLoading(false);
        return;
      }

      // Start proctoring ONLY now (after quiz begins) 
      setProctoringStarted(true);

      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) { console.error('Fullscreen error:', err); }
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setIsButtonLoading(false);
    }
  }, [checkUserAttempts, attemptsInfo, isButtonLoading]);

  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
  }, [currentQuestionIndex]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quizData?.quiz.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (!quizStarted || step !== 'quiz') return;
    if (timeLeft <= 0) {
      setSelectedAnswers(currentAnswers => { submitQuiz(currentAnswers); return currentAnswers; });
      return;
    }
    const timer = setInterval(() => { setTimeLeft(prev => prev - 1); }, 1000);
    return () => clearInterval(timer);
  }, [quizStarted, step, timeLeft, submitQuiz]);

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quizData.quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) correct++;
    });
    const total = quizData.quiz.length;
    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  };

  const quizInstructions = [
    { icon: <Shield className="w-5 h-5 text-red-500" />, title: 'Honor Code', text: 'This is an individual assessment. Cheating will result in disqualification.' },
    { icon: <BookOpen className="w-5 h-5 text-blue-500" />, title: 'Quiz Details', text: `${quizData?.num_questions || 'Multiple'} questions • ${quizData?.quiz_time || 30} minutes` },
    { icon: <User className="w-5 h-5 text-orange-500" />, title: 'Identity Verification', text: 'Only the person whose information was provided can attempt this quiz. Face verification will be performed.' },
    { icon: <User className="w-5 h-5 text-orange-500" />, title: 'Solo Attempt Required', text: 'You must attempt this quiz alone in a private room. No other person should be present.' },
    { icon: <AlertTriangle className="w-5 h-5 text-red-600" />, title: 'Multiple People Detection', text: 'If two or more people are detected during the quiz, it will be terminated immediately.' },
    { icon: <Lock className="w-5 h-5 text-red-500" />, title: 'No Devices Allowed', text: 'Mobile phones, tablets, or any other electronic devices are strictly prohibited during the quiz.' },
    { icon: <Eye className="w-5 h-5 text-purple-400" />, title: 'No External Help', text: 'No books, notes, websites, or any other sources of assistance are permitted.' },
    { icon: <Maximize2 className="w-5 h-5 text-amber-500" />, title: 'Full-Screen Mode', text: 'The quiz will start in full-screen. You must stay in full-screen mode.' },
    { icon: <AlertTriangle className="w-5 h-5 text-red-500" />, title: 'Important', text: 'Switching tabs or leaving full-screen will end your quiz immediately.' },
    { icon: <Eye className="w-5 h-5 text-purple-400" />, title: 'Camera Proctoring', text: 'Your webcam will be active during the quiz. Keep your face visible and centred.' },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-white">Confirm Exit</h3>
            </div>
            <p className="text-gray-300 mb-6">Are you sure you want to quit the quiz? This will end your current attempt.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleExitResponse(false)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-colors"
                disabled={isRestoring}
              >
                {isRestoring ? 'Restoring...' : 'Continue Quiz'}
              </button>
              <button
                onClick={() => handleExitResponse(true)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                disabled={isRestoring}
              >
                End Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="relative z-20 p-6 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white flex items-center">
            <Image src="/QuizzViz-logo.png" alt="QuizzViz Logo" width={50} height={50} />
            QuizzViz
          </Link>
          {step === 'quiz' && quizData && (
            <div className="flex items-center gap-4">
              <div className="bg-gray-800 rounded-2xl px-6 py-3 flex items-center gap-3 border border-gray-700">
                <Clock className="h-6 w-6 text-white" />
                <span className="font-mono text-white text-xl font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main id="quiz-content" className="relative z-10" tabIndex={-1}>
        {step === 'info' && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              {usageLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-400">Checking availability...</p>
                </div>
              ) : isCandidateLimitReached ? (
                <div className="text-center">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                      Candidate limit is reached
                    </h1>
                    <p className="text-gray-400">Upgrade to a plan to get more candidates</p>
                  </div>
                  <Card className="border-0 bg-white/5 backdrop-blur-lg shadow-xl rounded-2xl border border-white/10">
                    <CardContent className="p-8">
                      <div className="text-center">
                        <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-6" />
                        <p className="text-gray-300 mb-6 text-lg">
                          The number of candidates for this quiz has reached the plan limit.
                        </p>
                        <div className="space-y-4">
                          <Button asChild className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3">
                            <Link href="/pricing">
                              Upgrade Plan
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            asChild
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            <Link href="/">
                              <Home className="w-4 h-4 mr-2" />
                              Back to Home
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2">
                      Welcome to {formatCompanyIdToName(companyId)} Quiz
                    </h1>
                    <p className="text-gray-400">Enter your details to begin the assessment</p>
                  </div>

                  <Card className="border-0 bg-white/5 backdrop-blur-lg shadow-xl rounded-2xl border border-white/10">
                    <CardContent className="p-8">
                      <form onSubmit={handleSubmitInfo} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-300 font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-400" /> Full Name
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your Full Name"
                            required
                            className="h-12 bg-white/5 border-white/10 text-white placeholder-gray-400/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-purple-400" /> Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            required
                            className="h-12 bg-white/5 border-white/10 text-white placeholder-gray-400/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="quizKey" className="text-gray-300 font-medium flex items-center gap-2">
                            <Key className="w-4 h-4 text-green-400" /> Quiz Key
                          </Label>
                          <Input
                            id="quizKey"
                            name="quizKey"
                            value={formData.quizKey}
                            onChange={handleInputChange}
                            placeholder="Enter the quiz access key"
                            required
                            className="h-12 bg-white/5 border-white/10 text-white placeholder-gray-400/60 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                          />
                          {verificationError && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                              <p className="text-sm text-red-400 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> {verificationError}
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={verifying || showingMaxAttemptsNotification}
                          className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-blue-500/20"
                        >
                          {showingMaxAttemptsNotification ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : verifying ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              Continue to Quiz
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}