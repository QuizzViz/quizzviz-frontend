'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, AlertCircle, ArrowRight, Home, Trophy, Target, CheckCircle, BookOpen, Timer, Shield, Zap, Lock, Eye, Maximize2, Monitor } from 'lucide-react';
import { LoadingSpinner } from "@/components/ui/loading";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { formatTime } from '@/lib/utils';
import { useUserPlanContext } from '@/contexts/UserPlanContext';

interface Question {
  id: string | number;
  type: 'theory' | 'code_analysis';
  question: string;
  code_snippet?: string | null;
  options: Record<string, string>;
  correct_answer: string;
}

interface QuizData {
  quiz_id: string;
  role: string;
  techStack: Array<{name: string; weight: number }>;
  difficulty: string;
  num_questions: number;
  questions: Question[];
  quiz_time: number;
}

type Step = 'welcome' | 'instructions' | 'quiz' | 'results';

const QuizAttemptPage = () => {
  // Check if user is on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if the device is mobile
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const { plan } = useUserPlanContext();

  // Show mobile restriction message for business plan users on mobile
  if (isMobile && plan === 'Business') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <div className="max-w-md w-full bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 text-center border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative w-16 h-16 mb-4">
              <Image 
                src="/logo.png" 
                alt="QuizzViz" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              QuizzViz
            </h1>
          </div>
          
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-red-300 mb-2">
              <Monitor className="w-5 h-5" />
              <h3 className="font-semibold">Desktop/Laptop Required</h3>
            </div>
            <p className="text-gray-300 text-sm">
              This quiz cannot be taken on mobile devices. Please use a desktop or laptop computer to attempt this quiz.
            </p>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<Step>('welcome');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [warnings, setWarnings] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if user is on mobile and set up the component
  useEffect(() => {
    setIsClient(true);
    const mobileCheck = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(mobileCheck());
    
    // Show mobile restriction for business plan users
    if (mobileCheck() && plan === 'Business') {
      return;
    }

    // Rest of your existing useEffect logic
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasSubmittedRef.current && quizStarted && !exitConfirmationRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quizStarted]);
  
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

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const exitConfirmResolve = useRef<((value: boolean) => void) | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const shuffleOptions = (question: Question): Question => {
    const optionsEntries = Object.entries(question.options);
    const correctValue = question.options[question.correct_answer];
    const shuffledOptions = shuffleArray(optionsEntries);
    const newOptions: Record<string, string> = {};
    const labels = 'ABCD'; // Assuming 4 options
    let newCorrect: string | undefined;
    shuffledOptions.forEach(([oldKey, value], i) => {
      const newLabel = labels[i];
      newOptions[newLabel] = value;
      if (value === correctValue) {
        newCorrect = newLabel;
      }
    });
    question.options = newOptions;
    if (newCorrect) {
      question.correct_answer = newCorrect;
    }
    return question;
  };

  const calculateResults = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    const total = quizData.questions.length;
    
    Object.entries(selectedAnswers).forEach(([index, answer]) => {
      const question = quizData.questions[parseInt(index)];
      if (question && answer === question.correct_answer) {
        correct++;
      }
    });
    
    const percentage = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;
    
    return { correct, total, percentage };
  };

  const submitQuiz = useCallback(async (answers: Record<number, string>): Promise<boolean> => {
    if (hasSubmittedRef.current) {
      console.log('Quiz already submitted, skipping duplicate submission...');
      return true;
    }
    
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    
    if (!quizData) {
      console.error('Quiz data is missing');
      return false;
    }
    
    try {
      console.log('Initial answers:', answers);
      
      const allAnswers: Record<number, string> = {};
      quizData.questions.forEach((_, index) => {
        allAnswers[index] = answers[index] ?? '';
      });
      
      console.log('Processed answers before submission:', allAnswers);
      quizData.questions.forEach((_, index) => {
        if (!allAnswers.hasOwnProperty(index)) {
          allAnswers[index] = '';
        }
      });
      
      setSelectedAnswers(allAnswers);
      
      let correct = 0;
      const total = quizData.questions.length
      quizData.questions.map((question, index) => {
        const answer = allAnswers[index] || '';
        const isCorrect = answer === question.correct_answer;
        if (isCorrect) correct++;
        
        console.log(`Question ${index + 1}:`, { 
          answer, 
          correctAnswer: question.correct_answer, 
          isCorrect 
        });
        
        return {
          question_id: question.id.toString(),
          user_answer: answer,
          is_correct: isCorrect,
          correct_answer: question.correct_answer
        };
      });
      
      console.log('Processed answers:', { 
        correct, 
        total
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return false;
    } finally {
      setStep('results');
      setIsSubmitting(false);
    }
  }, [quizData]);

  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswers(prev => {
      const newAnswers = {
        ...prev,
        [currentQuestionIndex]: answer
      };
      console.log('Selected answers updated:', newAnswers);
      return newAnswers;
    });
  }, [currentQuestionIndex]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

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
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(console.error);
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }, []);

  const showWarningMessage = useCallback((message: string) => {
    setWarnings(prev => prev + 1);
    setShowWarning(true);
    
    window.focus();
    
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
    }, 5000);
  }, []);

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
      setSelectedAnswers(currentAnswers => {
        submitQuiz(currentAnswers);
        return currentAnswers;
      });
    } else {
      const quizContent = document.getElementById('quiz-content');
      if (quizContent) {
        quizContent.focus();
      }
    }
  }, [submitQuiz]);

  const isSubmittingRef = useRef(false);

  const handleFullscreenChange = useCallback(async () => {
    if (isSubmittingRef.current) return;
    
    if (exitConfirmationRef.current || !quizStarted || isRestoring) return;
    
    const isFullscreen = document.fullscreenElement || 
                        (document as any).webkitFullscreenElement || 
                        (document as any).msFullscreenElement;
    
    if (!isFullscreen) {
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
              console.warn(`Fullscreen restore attempt ${attempt + 1} failed, retrying...`);
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
        setTimeout(() => {
          exitConfirmationRef.current = false;
        }, 1000);
      }
    }
  }, [quizStarted, requestFullscreen, submitQuiz, selectedAnswers, confirmExit, isRestoring]);

  useEffect(() => {
    if (step === 'quiz' && quizStarted) {
      const enterFullscreen = async () => {
        try {
          await requestFullscreen();
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
              e.preventDefault();
              requestFullscreen();
            }
          });
        } catch (err) {
          console.error('Fullscreen error:', err);
        }
      };
      
      enterFullscreen();

      const handleVisibilityChange = () => {
        if (document.hidden && !hasSubmittedRef.current) {
          activityMonitorRef.current.warnings = 1;
          showWarningMessage('Quiz terminated due to tab switch!');
          toast({
            variant: "destructive",
            title: "Quiz terminated due to tab switch!",
            description: "The quiz has been terminated due to a violation of the test rules.",
            className: "max-w-[500px] mx-auto text-center rounded-lg text-sm p-4"
          });
          setSelectedAnswers(currentAnswers => {
            submitQuiz(currentAnswers);
            return currentAnswers;
          });
        } else if (!document.hidden) {
          requestFullscreen();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          showWarningMessage('Escape key is disabled during the quiz!');
          return false;
        }

        const forbiddenKeys = [
          'F12',
          'F11',
          ...(e.ctrlKey ? ['r', 'R', 'u', 'U', 'Shift'] : []),
          ...(e.ctrlKey && e.shiftKey ? ['i', 'I', 'j', 'J', 'c', 'C'] : [])
        ];

        if (forbiddenKeys.includes(e.key) || 
            (e.ctrlKey && e.key.toLowerCase() === 'r') ||
            (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') ||
            (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') ||
            (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') ||
            (e.ctrlKey && e.key.toLowerCase() === 'u')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 || e.clientX <= 0 || 
            e.clientX >= window.innerWidth || 
            e.clientY >= window.innerHeight) {
          showWarningMessage('Please keep your mouse within the quiz window!');
        }
      };

      const blockEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          e.stopPropagation();
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
      
      document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
      });

      document.addEventListener('copy', (e) => {
        e.preventDefault();
        return false;
      });

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your quiz progress will be lost.';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      const checkFullscreen = setInterval(() => {
        const isFullscreen = document.fullscreenElement || 
                           (document as any).webkitFullscreenElement ||
                           (document as any).mozFullScreenElement ||
                           (document as any).msFullscreenElement;
        
        if (!isFullscreen && quizStarted && !exitConfirmationRef.current && !hasSubmittedRef.current) {
          exitConfirmationRef.current = true;
          setShowExitConfirm(true);
          
          setSelectedAnswers(currentAnswers => {
            submitQuiz(currentAnswers);
            return currentAnswers;
          });
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
      };
    }
  }, [step, quizStarted, requestFullscreen, showWarningMessage, handleFullscreenChange, submitQuiz]);

  useEffect(() => {
    if (!quizStarted || step !== 'quiz') return;
    
    if (timeLeft <= 0) {
      setSelectedAnswers(currentAnswers => {
        submitQuiz(currentAnswers);
        return currentAnswers;
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, step, timeLeft, submitQuiz]);

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    
    const total = quizData.questions.length;
    const percentage = Math.round((correct / total) * 100);
    
    return { correct, total, percentage };
  };

  const quizInstructions = [
    {
      icon: <Shield className="w-5 h-5 text-red-500" />,
      title: 'Honor Code',
      text: 'This is an individual assessment. Cheating will result in disqualification.'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      title: 'Quiz Details',
      text: `${quizData?.num_questions || 'Multiple'} questions • ${(quizData?.num_questions as number) * 3 || 'Multiple'} minutes`
    },
    {
      icon: <Maximize2 className="w-5 h-5 text-amber-500" />,
      title: 'Full-Screen Mode',
      text: 'The quiz will start in full-screen. You must stay in full-screen mode.'
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      title: 'Important',
      text: 'Switching tabs or leaving full-screen will end your quiz immediately.'
    }
  ];

  useEffect(() => {
    let isMounted = true;
    
    const fetchQuiz = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      };
      
      const pathSegments = window.location.pathname.split('/');
      const quizId = pathSegments[pathSegments.length - 1];
      
      console.log('URL Path Segments:', pathSegments);
      console.log('Extracted Quiz ID:', quizId);
      
      if (!quizId || quizId === 'attempt') {
        console.error('No valid quiz ID found in URL');
        toast({
          title: 'Error',
          description: 'Invalid quiz link. Please try again from the dashboard.',
          variant: 'destructive',
          duration: 5000,
        });
        setIsLoading(false);
        router.push('/dashboard');
        return;
      }
      
      try {
        console.log('Fetching quiz with ID:', quizId);
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch(`/api/quiz/${quizId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch quiz:', { status: response.status, errorData });
          throw new Error(errorData.error || `Failed to fetch quiz (Status: ${response.status})`);
        }

        const data = await response.json();

        if (data.questions && !data.quiz) {
          data.quiz = data.questions;
        }

        console.log('Received quiz data:', data);
        
        let parsedQuiz: Question[] = [];
if (typeof data.quiz === 'string') {
  try {
    const parsed = JSON.parse(data.quiz);
    if (!Array.isArray(parsed)) {
      throw new Error('Parsed quiz data is not an array');
    }
    parsedQuiz = parsed;
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError, 'Raw quiz data:', data.quiz);
    throw new Error('Invalid quiz data format: Failed to parse quiz JSON - ' + (parseError as Error).message);
  }
} else if (Array.isArray(data.quiz)) {
  parsedQuiz = data.quiz;
} else {
  console.error('Unexpected quiz data type:', typeof data.quiz, data.quiz);
  throw new Error('Invalid quiz data format: Quiz data is not a string or array');
}

        // Validate each question structure
        parsedQuiz = parsedQuiz.map((q, index) => {
          if (!q.question || !q.options || !q.correct_answer) {
            console.warn(`Invalid question structure at index ${index}:`, q);
            throw new Error(`Invalid question at position ${index + 1}: Missing required fields`);
          }
          return q;
        });

        // Shuffle questions and options
        parsedQuiz = shuffleArray(parsedQuiz);
        parsedQuiz = parsedQuiz.map(shuffleOptions);
        
        const quizData: QuizData = {
          quiz_id: data.quiz_id || data.id,
          role: data.role,
          techStack: data.techStack,
          difficulty: data.difficulty,
          num_questions: data.num_questions || parsedQuiz.length,
          questions: parsedQuiz,
          quiz_time: (data.num_questions || parsedQuiz.length) * 3 * 60, // 3 minutes per question
        };
        
        console.log('Parsed quiz data:', quizData);
        
        if (isMounted) {
          setQuizData(quizData);
          setTimeLeft(quizData.quiz_time);
          setStep('welcome');
        }
        
      } catch (error: any) {
        console.error('Error in fetchQuiz:', error);
        
        if (!isMounted) return;
        
        let errorMessage = 'Failed to load quiz. Please try again.';
        
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'Quiz not found. It may have been deleted or you may not have permission to access it.';
        } else if (error.message.includes('401') || error.message.includes('403') || error.message.includes('token')) {
          errorMessage = 'You need to be logged in to access this quiz.';
        } else if (error.message.includes('Invalid quiz data format')) {
          errorMessage = 'The quiz data is in an invalid format. Please contact support.';
        } else if (error.message.includes('JSON Parse Error')) {
          errorMessage = 'Failed to parse quiz data from server. Please refresh and try again.';
        } else if (error.message.includes('No questions found')) {
          errorMessage = 'No questions available for this quiz. Please contact the quiz creator.';
        } else if (error.message.includes('Invalid question')) {
          errorMessage = 'One or more questions are malformed. Please contact support.';
        } else {
          errorMessage = `Failed to load quiz: ${error.message}`;
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
          duration: 7000,
        });
        
        setTimeout(() => {
          if (isMounted) {
            router.push('/dashboard');
          }
        }, 4000);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuiz();
    
    return () => {
      isMounted = false;
    };
  }, [getToken, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner text="Loading quiz..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Head>
        <title>{quizData?.role } Quiz | Quiz Attempt | QuizzViz</title>
      </Head>
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-white">Confirm Exit</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to quit the quiz? This will end your current attempt.
            </p>
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
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <header className="relative z-20 p-6 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white flex items-center">
          <Image src="/QuizzViz-logo.png" alt="QuizzViz Logo" width={50} height={50} />
           <span>QuizzViz</span>
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
        {step === 'welcome' && quizData && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Welcome {user?.firstName || 'User'}
                </h1>
                <p className="text-gray-400">Ready to start the quiz?</p>
              </div>

              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-8 flex justify-center">
                  <Button
                    onClick={() => setStep('instructions')}
                    className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Continue to Quiz
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
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
                <h1 className="text-3xl font-bold text-white mb-2">
                  {quizData?.role } Quiz
                </h1>
                <p className="text-gray-400">
                  {quizData?.difficulty ? `${quizData.difficulty.charAt(0).toUpperCase() + quizData.difficulty.slice(1)}` : 'Quiz'}
                </p>
              </div>

              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl mb-8">
                <CardContent className="p-6">
                  <ul className="space-y-5">
                    {quizInstructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {instruction.icon}
                        </div>
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
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Ensure a stable internet connection</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {isMobile ? (
                  <div className="w-full max-w-md mx-auto p-6 bg-red-900/20 border border-red-800/50 rounded-xl text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Monitor className="h-12 w-12 text-red-400" />
                      <h3 className="text-lg font-semibold text-white">Desktop Required</h3>
                      <p className="text-sm text-red-300">This quiz cannot be attempted on mobile devices. Please use a desktop or laptop computer to continue.</p>
                      <Button 
                        variant="outline" 
                        className="mt-2 text-red-300 border-red-500/50 hover:bg-red-900/30">
                        <Link className='text-red-300' href="/dashboard/my-quizzes">Close Page</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      setQuizStarted(true);
                      setStep('quiz');
                    }}
                    className="h-14 w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isButtonLoading || isMobile}
                  >
                    {isButtonLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        Start Quiz
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'quiz' && quizData && (
          <div className="min-h-[calc(100vh-80px)]">
            <div className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-20 z-10">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold text-white">
                    Question {currentQuestionIndex + 1} of {quizData.questions.length}
                  </div>
                  <div className="text-sm text-gray-400">
                    {Object.keys(selectedAnswers).length} answered
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl shadow-2xl mb-6">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6 leading-relaxed">
                    {quizData?.questions?.[currentQuestionIndex]?.question || 'Loading question...'}
                  </h2>

                  {quizData?.questions?.[currentQuestionIndex]?.code_snippet && (
                    <div className="mb-8 rounded-xl overflow-hidden border border-gray-700">
                      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                        <span className="text-sm text-gray-300 font-medium">Code Preview</span>
                      </div>
                      <SyntaxHighlighter
                        language="python"
                        style={atomDark}
                        customStyle={{
                          margin: 0,
                          backgroundColor: '#1F2937',
                          fontSize: '0.95rem',
                          lineHeight: '1.6',
                          padding: '1.5rem',
                        }}
                        wrapLines={true}
                        showLineNumbers={true}
                      >
                        {quizData.questions[currentQuestionIndex].code_snippet || ''}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-white font-medium mb-4">Choose your answer:</h3>
                    {Object.entries(quizData.questions[currentQuestionIndex].options)
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
                                isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-500 group-hover:border-gray-400'
                              }`}>
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                )}
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
                {currentQuestionIndex < quizData.questions.length - 1 ? (
                  <Button 
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQuestionIndex]}
                    className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg rounded-xl"
                  >
                    {!selectedAnswers[currentQuestionIndex] ? (
                      'Select an answer to continue'
                    ) : (
                      <>
                        Next Question
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => submitQuiz(selectedAnswers)}
                    disabled={!selectedAnswers[currentQuestionIndex] || isSubmitting}
                    className="h-14 px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Submit Quiz
                      </>
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
                <p className="text-gray-400">Here are your results</p>
              </div>

              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${calculateScore().percentage * 2.51} 251`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
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
                          <div className="text-5xl font-bold text-white mb-2">
                            {calculateScore().percentage}%
                          </div>
                          <div className="text-gray-400 text-sm">Your Score</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {calculateScore().correct}
                      </div>
                      <div className="text-sm text-gray-400">Correct</div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-red-400 mb-1">
                        {quizData.questions.length - calculateScore().correct}
                      </div>
                      <div className="text-sm text-gray-400">Incorrect</div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {quizData.questions.length}
                      </div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl mb-8 border ${
                    calculateScore().percentage >= 70 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : calculateScore().percentage >= 50 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {calculateScore().percentage >= 90 
                          ? 'Excellent Performance!' 
                          : calculateScore().percentage >= 70 
                            ? 'Good Effort!' 
                            : 'Keep Practicing!'}
                      </h3>
                      <p className="text-gray-300">
                        {calculateScore().percentage >= 90 
                          ? 'You demonstrated strong understanding of the material. Well done!' 
                          : calculateScore().percentage >= 70
                            ? 'You have a solid foundation.Review the topics you missed for improvement.' 
                            : 'Consider reviewing the material and practicing more to improve your understanding.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      Quiz Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Role:</span>
                        <span className="text-white font-medium">{quizData.role}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Difficulty:</span>
                        <span className="text-white font-medium capitalize">{quizData.difficulty}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Questions:</span>
                        <span className="text-white font-medium">{quizData.questions.length}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Time Limit:</span>
                        <span className="text-white font-medium">{quizData.quiz_time / 60} min</span>
                      </div>
                      {quizData.techStack && quizData.techStack.length > 0 && (
                        <div className="pt-2">
                          <div className="text-gray-400 mb-2">Tech Stack:</div>
                          <div className="flex flex-wrap gap-2">
                            {quizData.techStack.map((tech, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-800/50"
                              >
                                {tech.name}
                                {tech.weight && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-800/50 text-blue-200 text-xs">
                                    {tech.weight}%
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    {plan === 'Consumer' || plan === 'Elite' ? (
                      <Button 
                        onClick={() => setShowCorrectAnswers(true)}
                        className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <Eye className="mr-2 h-5 w-5" />
                        See Correct Answers
                      </Button>
                    ) : (
                      <div className="relative group">
                        <Button 
                          disabled
                          className="h-12 px-8 bg-gray-600 text-white font-medium rounded-xl cursor-not-allowed opacity-100"
                        >
                          <Lock className="mr-2 h-5 w-5" />
                          See Correct Answers
                        </Button>
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 hidden group-hover:block w-64 bg-black/95 border border-gray-700 text-gray-100 text-sm rounded-lg p-3 shadow-2xl shadow-black/50 text-center transition-all duration-200 ease-in-out">
                          <div className="flex items-center justify-center space-x-1">
                            <Zap className="w-4 h-4 text-blue-400" />
                            <span>Upgrade to <Link href="/pricing" className="font-semibold text-blue-500 underline">Consumer Plan</Link> to see correct answers</span>
                          </div>
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black/95 border-b border-r border-gray-700 rotate-45"></div>
                        </div>
                      </div>
                    )}
                    <Button 
                      asChild 
                      className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <Link href="/dashboard" className="flex items-center">
                        <Home className="mr-2 h-5 w-5" />
                        Return to Dashboard
                      </Link>
                    </Button>
                  </div>

                  {/* Enhanced Correct Answers Modal */}
                  {showCorrectAnswers && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                      <div className="bg-gray-900 border border-gray-700/50 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800/90 backdrop-blur-sm p-6 border-b border-gray-700/50 flex justify-between items-center">
                          <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              Quiz Review
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">Review your answers and learn from any mistakes</p>
                          </div>
                          <button 
                            onClick={() => setShowCorrectAnswers(false)}
                            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-700/50"
                            aria-label="Close"
                          >
                            <XCircle className="h-6 w-6" />
                          </button>
                        </div>
                        
                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-8">
                          {quizData.questions.map((question, index) => {
                            const isCorrect = selectedAnswers[index] === question.correct_answer;
                            return (
                              <div 
                                key={index} 
                                className={`bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border ${
                                  isCorrect ? 'border-green-500/20' : 'border-red-500/20'
                                } transition-all duration-300 hover:shadow-lg hover:shadow-${isCorrect ? 'green' : 'red'}-500/10`}
                              >
                                {/* Question Header */}
                                <div className="flex items-start gap-4 mb-4">
                                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium ${
                                    isCorrect ? 'bg-green-500/90' : 'bg-red-500/90'
                                  }`}>
                                    {isCorrect ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-lg font-medium text-white">
                                        Question {index + 1}
                                      </h4>
                                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                        isCorrect 
                                          ? 'bg-green-500/20 text-green-400' 
                                          : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {isCorrect ? 'Correct' : 'Incorrect'}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-gray-300">{question.question}</p>
                                  </div>
                                </div>

                                {/* Code Snippet */}
                                {question.code_snippet && (
                                  <div className="mt-4 mb-6 overflow-hidden rounded-lg border border-gray-700/50 shadow-lg">
                                    <div className="bg-gray-900/80 px-4 py-2 border-b border-gray-700/50 flex items-center">
                                      <div className="flex space-x-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      </div>
                                      <span className="text-xs text-gray-400 ml-2">code_snippet.py</span>
                                    </div>
                                    <SyntaxHighlighter 
                                      language="python" 
                                      style={atomDark}
                                      showLineNumbers={true}
                                      wrapLines={true}
                                      className="text-sm !m-0 !p-4"
                                      customStyle={{
                                        background: '#0f172a',
                                        margin: 0,
                                        padding: '1rem',
                                        borderRadius: 0
                                      }}
                                    >
                                      {question.code_snippet}
                                    </SyntaxHighlighter>
                                  </div>
                                )}

                                {/* Options */}
                                <div className="space-y-3 mt-4">
                                  <p className="text-sm font-medium text-gray-300 mb-2">Options:</p>
                                  {Object.entries(question.options).map(([key, value]) => {
                                    const isCorrectOption = key === question.correct_answer;
                                    const isUserSelection = selectedAnswers[index] === key;
                                    
                                    return (
                                      <div 
                                        key={key}
                                        className={`p-3.5 rounded-xl border-2 transition-all duration-200 ${
                                          isCorrectOption
                                            ? 'border-green-500/30 bg-green-500/5'
                                            : isUserSelection
                                              ? 'border-red-500/30 bg-red-500/5'
                                              : 'border-gray-700/50 hover:border-gray-600/50 bg-gray-800/30'
                                        }`}
                                      >
                                        <div className="flex items-start">
                                          <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                                            isCorrectOption
                                              ? 'bg-green-500/90 text-white'
                                              : isUserSelection
                                                ? 'bg-red-500/90 text-white'
                                                : 'bg-gray-700/50 text-gray-400'
                                          }`}>
                                            {isCorrectOption ? (
                                              <CheckCircle2 className="h-3 w-3" />
                                            ) : isUserSelection ? (
                                              <XCircle className="h-3 w-3" />
                                            ) : key + '.'}
                                          </div>
                                          <div>
                                            <span className={`text-sm ${
                                              isCorrectOption 
                                                ? 'text-green-300 font-medium' 
                                                : isUserSelection
                                                  ? 'text-red-300 font-medium'
                                                  : 'text-gray-300'
                                            }`}>
                                              {value}
                                            </span>
                                            {isCorrectOption && (
                                              <div className="mt-1.5 flex items-center text-xs text-green-400">
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                <span>Correct Answer</span>
                                              </div>
                                            )}
                                            {isUserSelection && !isCorrectOption && (
                                              <div className="mt-1.5 flex items-center text-xs text-red-400">
                                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                                <span>Your Selection</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-900/90 backdrop-blur-sm p-4 border-t border-gray-700/50 flex justify-between items-center">
                          <div className="text-sm text-gray-400">
                            <span className="text-green-400 font-medium">{calculateScore().correct} correct</span>
                            <span className="mx-2">•</span>
                            <span className="text-red-400 font-medium">
                              {quizData.questions.length - calculateScore().correct} incorrect
                            </span>
                          </div>
                          <Button 
                            onClick={() => setShowCorrectAnswers(false)}
                            className="h-10 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
                          >
                            Close Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default QuizAttemptPage;