'use client';
import { use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { usePlanLimitsByCompanyId } from '@/hooks/usePlanLimitsByCompanyId';
import { useCompanyUsageByCompanyId } from '@/hooks/useCompanyUsageByCompanyId';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, User, Mail, Key, ArrowRight, Home, Trophy, Target, CheckCircle, BookOpen, Timer, Shield, Zap, Lock, Eye, AlertTriangle, Maximize2, Monitor,ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingSpinner } from "@/components/ui/loading";

import { toast } from "@/hooks/use-toast";
import { formatTime } from '@/lib/utils';
import { formatCompanyIdToName } from '@/utils/companyUtils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useUser } from '@clerk/nextjs';
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

function CameraPermissionModal({ onGranted, onDismiss }: { 
  onGranted: () => void; 
  onDismiss: () => void; 
}) {
  const [retrying, setRetrying] = useState(false);
  const [status, setStatus] = useState<'prompt' | 'retrying' | 'error'>('prompt');

  const handleTryAgain = async () => {
    setRetrying(true);
    setStatus('retrying');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setStatus('prompt');
      onGranted(); // ✅ Camera now available, proceed
    } catch (err) {
      setStatus('error');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white text-center mb-2">
          Camera Access Required
        </h3>
        <p className="text-gray-400 text-center text-sm mb-6">
          This quiz requires your camera to be active for proctoring. You cannot start without enabling camera access.
        </p>

        {/* Steps */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 space-y-3">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-3">How to enable your camera</p>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-xs font-bold">1</span>
            </div>
            <p className="text-gray-300 text-sm">Click the camera/lock icon in your browser's address bar</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-xs font-bold">2</span>
            </div>
            <p className="text-gray-300 text-sm">Set Camera permission to <span className="text-white font-medium">"Allow"</span></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 text-xs font-bold">3</span>
            </div>
            <p className="text-gray-300 text-sm">Click <span className="text-white font-medium">"Try Again"</span> below to verify and start</p>
          </div>
        </div>

        {/* Error state */}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">Camera still blocked. Please check your browser settings and try again.</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleTryAgain}
            disabled={retrying}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl"
          >
            {retrying ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking Camera...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-5 w-5" /> Try Again</>
            )}
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            disabled={retrying}
            className="w-full h-12 border-gray-700 text-gray-300 hover:bg-gray-800 rounded-xl"
          >
            Cancel
          </Button>
        </div>

      </div>
    </div>
  );
}

function AttemptsModal({
  attemptsInfo,
  onClose,
  onStart,
  isLoading,
}: {
  attemptsInfo: { current: number; max: number };
  onClose: () => void;
  onStart: () => void;
  isLoading: boolean;
}) {
  const remaining = attemptsInfo.max - attemptsInfo.current;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">

        {/* Icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center border border-blue-500/20">
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Multiple attempts allowed</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Attempt dots tracker */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
          <p className="text-xs text-gray-400 mb-3">Your attempts for this quiz</p>
          <div className="flex items-center gap-2">
            {Array.from({ length: attemptsInfo.max }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < attemptsInfo.current
                    ? 'bg-red-500'
                    : i === attemptsInfo.current
                    ? 'bg-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-white/15'
                }`}
              />
            ))}
            <span className="text-sm text-gray-300 ml-2">
              Attempt {attemptsInfo.current + 1} of {attemptsInfo.max}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            You have{' '}
            <span className="text-blue-400 font-medium">{remaining} more attempt{remaining !== 1 ? 's' : ''}</span>{' '}
            after this one.
          </p>
        </div>

        {/* Info rows */}
        <div className="space-y-0 mb-5 border border-white/10 rounded-xl overflow-hidden">
          {[
            { label: 'Each attempt', value: 'Independent score' },
            { label: 'Questions', value: 'Reshuffled each attempt' },
            { label: 'Remaining after this', value: `${remaining} attempt${remaining !== 1 ? 's' : ''}` },
          ].map(({ label, value }, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 text-sm border-b border-white/[0.07] last:border-b-0"
            >
              <span className="text-gray-400">{label}</span>
              <span className="text-gray-200 font-medium">{value}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onStart}
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Starting...</>
          ) : (
            <>Start attempt {attemptsInfo.current + 1} <ArrowRight className="ml-2 h-5 w-5" /></>
          )}
        </Button>

        <p className="text-center text-xs text-gray-500 mt-3">
          Questions are reshuffled each attempt
        </p>
      </div>
    </div>
  );
}

export default function QuizPage({ params }: PageProps) {
  const { companyId, quizId } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState<'info' | 'instructions' | 'quiz-info' | 'quiz' | 'results'>('info');
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', quizKey: '' });
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const proceedAfterCameraRef = useRef<(() => void) | null>(null);
  const [isTopicPerformanceOpen, setIsTopicPerformanceOpen] = useState(true);

  // Shuffle options for all quiz questions
  const shuffleOptions = useCallback((question: Question): Question => {
    console.log('Shuffling options for question:', question.type, question.question);
    console.log('Original options:', question.options);
    
    if (question.options && typeof question.options === 'object') {
      const options = { ...question.options };
      const entries = Object.entries(options);
      let shuffledEntries = [...entries];

      // Special handling for code_analysis type to keep question text separate
      if (question.type === 'code_analysis') {
        const questionKey = entries.find(([_, value]) => value === question.question)?.[0];
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
      } else {
        // For all other question types, just shuffle all options
        for (let i = shuffledEntries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledEntries[i], shuffledEntries[j]] = [shuffledEntries[j], shuffledEntries[i]];
        }
      }
      
      const shuffledOptions = Object.fromEntries(shuffledEntries);
      return { ...question, options: shuffledOptions };
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
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);

  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const { data: usageData, isLoading: usageLoading } = useCompanyUsageByCompanyId(companyId);
const currentUsage = {
  quizzesThisMonth: 0,
  totalCandidates: usageData?.current_month?.unique_candidates || 0,
  teamMembers: 0
};

const {
  isCandidateLimitReached,
  candidateLimit,
  currentCandidates,
} = usePlanLimitsByCompanyId(companyId, currentUsage);

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
  const hasShownAttemptsModalRef = useRef(false);

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
            const shuffledQuestions = shuffleArray([...data.quiz]);
            const shuffledQuizWithShuffledOptions = {
              ...data,
              quiz: shuffledQuestions.map(question => shuffleOptions(question))
            };
            setQuizData(shuffledQuizWithShuffledOptions);
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
const topicPerformance = calculateTopicWisePerformance();

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
          topic_percentages: topicPerformance,
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

  useEffect(() => {
    if (
      step === 'instructions' &&
      quizData?.max_attempts &&
      quizData.max_attempts > 1 &&
      !hasShownAttemptsModalRef.current
    ) {
      hasShownAttemptsModalRef.current = true;
      setShowAttemptsModal(true);
    }
  }, [step, quizData]);

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

  const calculateTopicWisePerformance = () => {
    if (!quizData || !quizData.tech_stack || quizData.tech_stack.length === 0) {
      return [];
  }

  // Group questions by their actual topic field
  const questionsByTopic = quizData.quiz.reduce((acc, question, index) => {
    const topicName = (question as any).topic?.trim();
    if (!topicName || topicName === 'Unknown Topic' || topicName === '') {
      return acc; // Skip questions without valid topic names
    }
    if (!acc[topicName]) {
      acc[topicName] = [];
    }
    acc[topicName].push({ question, globalIndex: index });
    return acc;
  }, {} as Record<string, Array<{ question: Question; globalIndex: number }>>);

  // Only include topics that actually have questions
  return Object.entries(questionsByTopic)
    .filter(([_, topicQuestions]) => topicQuestions.length > 0)
    .map(([topicName, topicQuestions]) => {
      let correctInTopic = 0;
      topicQuestions.forEach(({ question, globalIndex }) => {
        if (selectedAnswers[globalIndex] === question.correct_answer) {
          correctInTopic++;
        }
      });

      const topicPercentage = topicQuestions.length > 0
        ? Math.round((correctInTopic / topicQuestions.length) * 100)
        : 0;

      const techStackItem = quizData.tech_stack?.find(tech => tech.name === topicName);
      const topicWeight = techStackItem ? techStackItem.weight : 0;

      return {
        name: topicName,
        percentage: topicPercentage,
        total_questions: topicQuestions.length,
        correct_questions: correctInTopic
      };
    })
    .sort((a, b) => b.total_questions - a.total_questions);
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

      const shuffledQuestions = shuffleArray([...data.quiz]);
      const shuffledQuizWithShuffledOptions = {
        ...data,
        quiz: shuffledQuestions.map(question => shuffleOptions(question))
      };
      setQuizData(shuffledQuizWithShuffledOptions);
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
  if (isCandidateLimitReached) {
    toast({
      variant: 'destructive',
      title: 'Candidate Limit Reached',
      description: `The quiz has reached its candidate limit (${currentCandidates}/${candidateLimit}).`,
      duration: 5000,
    });
    return;
  }
  await verifyQuizKey();
};

  const startQuiz = () => { setStep('quiz-info'); };

const startQuizFlow = useCallback(async () => {
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobileDevice) {
    toast({
      variant: 'destructive',
      title: 'Quiz Terminated',
      description: 'Mobile devices are not allowed for proctored quizzes.',
      duration: 5000,
      className: 'font-medium',
    });
    setSelectedAnswers(currentAnswers => {
      submitQuiz(currentAnswers);
      return currentAnswers;
    });
    return;
  }

  setQuizStarted(true);
  setStep('quiz');
  setProctoringStarted(true);

  if (document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }
}, [submitQuiz]);

const beginQuiz = useCallback(async () => {
  if (isButtonLoading) return;
  setIsButtonLoading(true);

  try {
    if (attemptsInfo.current >= attemptsInfo.max) {
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
    if (!hasAttemptsLeft) return;

    // ── CAMERA CHECK ─────────────────────────────────────────
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      // Camera OK — proceed directly
      await startQuizFlow();
    } catch (camError) {
      // Camera blocked — show modal, store callback for after grant
      setShowCameraModal(true);
      proceedAfterCameraRef.current = () => startQuizFlow();
    }
    // ─────────────────────────────────────────────────────────

  } catch (error) {
    console.error('Error starting quiz:', error);
  } finally {
    setIsButtonLoading(false);
  }
}, [checkUserAttempts, attemptsInfo, isButtonLoading, startQuizFlow]);

  const handleRetry = useCallback(() => {
    setStep('instructions');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(quizData ? quizData.quiz_time * 60 : 0);
    setQuizStarted(false);
    setProctoringStarted(false);
    hasSubmittedRef.current = false;
    isSubmittingRef.current = false;
    exitConfirmationRef.current = false;
    hasShownAttemptsModalRef.current = false;

    if (quizData) {
      const reshuffled = shuffleArray([...quizData.quiz]).map(q => shuffleOptions(q));
      setQuizData(prev => prev ? { ...prev, quiz: reshuffled } : prev);
    }
  }, [quizData, shuffleOptions]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quizData?.quiz.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleAnswerSelect = (answerKey: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerKey
    }));
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
      {/* Camera Permission Modal */}
{showCameraModal && (
  <CameraPermissionModal
    onGranted={() => {
      setShowCameraModal(false);
      if (proceedAfterCameraRef.current) {
        proceedAfterCameraRef.current();
        proceedAfterCameraRef.current = null;
      }
    }}
    onDismiss={() => {
      setShowCameraModal(false);
      proceedAfterCameraRef.current = null;
    }}
  />
)}

{showAttemptsModal && (
  <AttemptsModal
    attemptsInfo={attemptsInfo}
    onClose={() => setShowAttemptsModal(false)}
    onStart={() => {
      setShowAttemptsModal(false);
      // Stay on instructions page - user will click Start Quiz button
    }}
    isLoading={isButtonLoading}
  />
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
        <LoadingSpinner text="Checking availability..." />
      ) : isMobile ? (
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            Desktop Only
          </h1>
          <p className="text-gray-400 mb-8">This quiz must be taken on a laptop or desktop computer.</p>
          <Card className="border-0 bg-white/5 backdrop-blur-lg shadow-xl rounded-2xl border border-white/10">
            <CardContent className="p-8">
              <Monitor className="h-16 w-16 text-orange-500 mx-auto mb-6" />
              <p className="text-gray-300 mb-6 text-lg">
                Mobile and tablet devices are not supported for proctored assessments. Please switch to a desktop or laptop to continue.
              </p>
              <Button variant="outline" asChild className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                <Link href="/"><Home className="w-4 h-4" /> Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      ) : isCandidateLimitReached ? (
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            Candidate limit reached
          </h1>
          <p className="text-gray-400 mb-8">Upgrade your plan to allow more candidates.</p>
          <Card className="border-0 bg-white/5 backdrop-blur-lg shadow-xl rounded-2xl border border-white/10">
            <CardContent className="p-8">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-6" />
              <p className="text-gray-300 mb-6 text-lg">
                The number of candidates for this quiz has reached the plan limit ({currentCandidates}/{candidateLimit}).
              </p>
              <div className="space-y-4">
                <Button asChild className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                  <Link href="/pricing">Upgrade Plan</Link>
                </Button>
                <Button variant="outline" asChild className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                  <Link href="/"><Home className="w-4 h-4" /> Back to Home</Link>
                </Button>
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
                    id="name" name="name" value={formData.name} onChange={handleInputChange}
                    placeholder="Enter your Full Name" required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder-gray-400/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" /> Email
                  </Label>
                  <Input
                    id="email" type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="Enter your email" required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder-gray-400/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quizKey" className="text-gray-300 font-medium flex items-center gap-2">
                    <Key className="w-4 h-4 text-green-400" /> Quiz Key
                  </Label>
                  <Input
                    id="quizKey" name="quizKey" value={formData.quizKey} onChange={handleInputChange}
                    placeholder="Enter the quiz access key" required
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
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                >
                  {verifying ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying...</>
                  ) : (
                    <>Continue to Quiz <ArrowRight className="ml-2 h-5 w-5" /></>
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

        {step === 'instructions' && quizData && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{quizData?.role} Quiz</h1>
                <p className="text-gray-400 mb-3">
                  {quizData?.experience ? `${quizData.experience.charAt(0).toUpperCase() + quizData.experience.slice(1)} yrs` : 'Quiz'}
                </p>
                {quizData?.max_attempts && quizData.max_attempts > 1 && (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">
                      <AlertCircle className="w-3 h-3" />
                      {quizData.max_attempts} attempts allowed
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-300 border border-green-500/20">
                      Attempt {attemptsInfo.current + 1} of {quizData.max_attempts}
                    </span>
                  </div>
                )}
              </div>

              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl mb-8">
                <CardContent className="p-6">
                  <ul className="space-y-5">
                    {quizInstructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-0.5">{instruction.icon}</div>
                        <div>
                          <h3 className="font-medium text-white">{instruction.title}</h3>
                          <p className="text-gray-300 text-sm">{instruction.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-5 mb-8">
                <div className="flex items-start gap-3.5">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-2">Important Guidelines</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>Do not switch tabs, windows, or use other devices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>Keep the browser in full-screen mode</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>Keep your face visible in the camera at all times</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Ensure a stable internet connection</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {attemptsInfo && attemptsInfo.current >= attemptsInfo.max ? (
                  <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl">
                    <div className="flex items-center justify-center gap-2 text-red-300">
                      <AlertCircle className="w-5 h-5" />
                      <span>Maximum attempts reached ({attemptsInfo.current}/{attemptsInfo.max})</span>
                    </div>
                    <p className="text-sm text-red-200 mt-1">You've used all available attempts for this quiz.</p>
                  </div>
                ) : (
                  <Button
                    onClick={beginQuiz}
                    className="h-14 w-full max-w-md bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={attemptsInfo.current >= attemptsInfo.max || isButtonLoading || showingMaxAttemptsNotification}
                  >
                    {showingMaxAttemptsNotification ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" />Verifying attempts...</>
                    ) : isButtonLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" />{attemptsInfo.current > 0 ? 'Continuing...' : 'Starting...'}</>
                    ) : (
                      <>{attemptsInfo.current > 0 ? 'Continue to Quiz' : 'Start Quiz'} <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'quiz' && quizData && (
          <div className="min-h-[calc(100vh-80px)]">
            {/* ── CameraProctoring: mounted when quiz step is active,
                 detection begins only when proctoringStarted = true ── */}
            <CameraProctoring
              onViolation={handleProctoringViolation}
              onEnd={handleProctoringEnd}
              isActive={true}
              isStarted={proctoringStarted}
            />

            <div className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-20 z-10">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold text-white">
                    Question {currentQuestionIndex + 1} of {quizData.quiz.length}
                  </div>
                  <div className="text-sm text-gray-400">{Object.keys(selectedAnswers).length} answered</div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / quizData.quiz.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl shadow-2xl mb-6">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6 leading-relaxed">
                    {quizData?.quiz?.[currentQuestionIndex]?.question || 'Loading question...'}
                  </h2>

                  {quizData?.quiz?.[currentQuestionIndex]?.code_snippet && (
                    <div className="mb-8 rounded-xl overflow-hidden border border-gray-700">
                      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                        <span className="text-sm text-gray-300 font-medium">Code Preview</span>
                      </div>
                      <SyntaxHighlighter
                        language="python"
                        style={atomDark}
                        customStyle={{ margin: 0, backgroundColor: '#1F2937', fontSize: '0.95rem', lineHeight: '1.6', padding: '1.5rem' }}
                        wrapLines={true}
                        showLineNumbers={true}
                      >
                        {quizData.quiz[currentQuestionIndex].code_snippet || ''}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-white font-medium mb-4">Choose your answer:</h3>
                    {Object.entries(quizData.quiz[currentQuestionIndex].options)
                      .filter(([key]) => key !== 'question')
                      .map(([key, value]) => {
                        const isSelected = selectedAnswers[currentQuestionIndex] === key;
                        return (
                          <div
                            key={key}
                            onClick={() => handleAnswerSelect(key)}
                            className={`group relative p-6 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                : 'border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                                isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-500 group-hover:border-gray-400'
                              }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                              </div>
                              <div className="ml-4 flex-1">
                                <span className="text-gray-100 leading-relaxed text-lg">{value}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-start">
                {currentQuestionIndex < quizData.quiz.length - 1 ? (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQuestionIndex]}
                    className="h-14 px-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg rounded-xl"
                  >
                    {!selectedAnswers[currentQuestionIndex] ? 'Select an answer to continue' : <>Next Question <ArrowRight className="ml-2 h-5 w-5" /></>}
                  </Button>
                ) : (
                  <Button
                    onClick={() => submitQuiz(selectedAnswers)}
                    disabled={!selectedAnswers[currentQuestionIndex] || isSubmitting}
                    className="h-14 px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg rounded-xl"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</>
                    ) : (
                      <><CheckCircle className="mr-2 h-5 w-5" />Submit Quiz</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'results' && quizData && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {calculateScore().percentage >= 70 ? 'Congratulations!' : 'Quiz Complete!'}
                </h1>
                <p className="text-gray-400">Here is your result</p>
              </div>

              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-700" />
                        <circle
                          cx="50" cy="50" r="40" stroke="url(#gradient)" strokeWidth="8" fill="none"
                          strokeDasharray={`${calculateScore().percentage * 2.51} 251`}
                          strokeLinecap="round" className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-white mb-2">{calculateScore().percentage}%</div>
                          <div className="text-gray-400 text-sm">Your Score</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-green-400 mb-1">{calculateScore().correct}</div>
                      <div className="text-sm text-gray-400">Correct</div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-red-400 mb-1">{quizData.quiz.length - calculateScore().correct}</div>
                      <div className="text-sm text-gray-400">Incorrect</div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-400 mb-1">{quizData.quiz.length}</div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                  </div>

                  {/* Topic-wise Performance Section */}
{calculateTopicWisePerformance().length > 0 && (
  <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
    {/* Clickable header with arrow toggle */}
    <button
      onClick={() => setIsTopicPerformanceOpen(!isTopicPerformanceOpen)}
      className="w-full flex items-center justify-between text-left hover:bg-gray-700/20 rounded-lg p-2 -m-2 transition-all duration-200"
    >
      <h4 className="text-white font-semibold flex items-center gap-2">
        <Target className="w-5 h-5 text-purple-400" />
        Topic-wise Performance
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700/50">
          {calculateTopicWisePerformance().length} topics
        </span>
      </h4>
      <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
        isTopicPerformanceOpen
          ? 'bg-purple-600/20 text-purple-300'
          : 'bg-gray-600/20 text-gray-300'
      }`}>
        {isTopicPerformanceOpen
          ? <ChevronUp className="w-4 h-4" />
          : <ChevronDown className="w-4 h-4" />
        }
      </div>
    </button>

    {/* Collapsible content */}
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
      isTopicPerformanceOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
    }`}>
      <div className="space-y-4">
        {calculateTopicWisePerformance().map((topic, index) => (
          <div key={index} className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  topic.percentage >= 70 ? 'bg-green-500' :
                  topic.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-white font-medium">{topic.name}</span>
                              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  topic.percentage >= 70 ? 'text-green-400' :
                  topic.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {topic.percentage}%
                </div>
                <div className="text-gray-400 text-sm">
                  {topic.correct_questions}/{topic.total_questions} correct
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  topic.percentage >= 70 ? 'bg-green-500' :
                  topic.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${topic.percentage}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {topic.percentage >= 70 ? 'Excellent performance in this area!' :
               topic.percentage >= 50 ? 'Good understanding, room for improvement.' :
               'Focus on strengthening this topic.'}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

                  <div className={`p-6 rounded-xl mb-8 border ${
                    calculateScore().percentage >= 70 ? 'bg-green-500/10 border-green-500/30'
                      : calculateScore().percentage >= 50 ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {calculateScore().percentage >= 70 ? 'Excellent Performance!'
                          : calculateScore().percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
                      </h3>
                      <p className="text-gray-300">
                        {calculateScore().percentage >= 70
                          ? 'You demonstrated strong understanding of the material. Well done!'
                          : calculateScore().percentage >= 50
                          ? 'You have a solid foundation. Review the topics you missed for improvement.'
                          : 'Consider reviewing the material and practicing more to improve your understanding.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-400" /> Quiz Summary
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Role', value: quizData.role },
                        { label: 'Experience', value: <span className="capitalize">{quizData.experience} yrs</span> },
                        { label: 'Questions', value: quizData.quiz.length },
                        { label: 'Time Limit', value: `${quizData.quiz_time} min` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-700/50">
                          <span className="text-gray-400">{label}:</span>
                          <span className="text-white font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex flex-col gap-3">
                      {/* Attempt status banner */}
                      {quizData?.max_attempts && quizData.max_attempts > 1 && (
                        <>
                          {attemptsInfo.current < attemptsInfo.max ? (
                            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/25 rounded-xl mb-2">
                              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-300">
                                  {attemptsInfo.max - attemptsInfo.current - 1} attempt{attemptsInfo.max - attemptsInfo.current - 1 !== 1 ? 's' : ''} remaining
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Want to improve your score?
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl mb-2">
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-red-300">No attempts remaining</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  You've used all {attemptsInfo.max} attempts for this quiz.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Attempt dots */}
                          <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-xl mb-2">
                            <span className="text-xs text-gray-500 mr-1">Attempts:</span>
                            {Array.from({ length: attemptsInfo.max }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  i < attemptsInfo.current ? 'bg-red-500' : 'bg-white/15'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">
                              {attemptsInfo.current + 1} used · {attemptsInfo.max - attemptsInfo.current - 1} left
                            </span>
                          </div>
                        </>
                      )}

                      {/* Primary CTA */}
                      {attemptsInfo.current < attemptsInfo.max ? (
                        <Button
                          onClick={handleRetry}
                          className="h-12 px-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                        >
                          <ArrowRight className="mr-2 h-5 w-5" />
                          Try again ({attemptsInfo.max - attemptsInfo.current - 1} left)
                        </Button>
                      ) : (
                        <Button
                          asChild
                          className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                        >
                          <Link href="/" className="flex items-center">
                            <Home className="mr-2 h-5 w-5" /> Return to Home
                          </Link>
                        </Button>
                      )}

                      {/* Secondary: always show Return to Home if attempts remain */}
                      {attemptsInfo.current < attemptsInfo.max && (
                        <Button
                          asChild
                          variant="outline"
                          className="h-11 px-8 border-gray-700 text-gray-300 hover:bg-gray-800 rounded-xl"
                        >
                          <Link href="/" className="flex items-center">
                            <Home className="mr-2 h-4 w-4" /> Return to Home
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}