'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, User, Mail, Key, ArrowRight, Home, Trophy, Target, CheckCircle, BookOpen, Timer, Shield, Zap, Lock, Eye, AlertTriangle, Maximize2, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { formatTime } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Question {
  id: string | number;
  type: 'theory' | 'code_analysis';
  question: string;
  code_snippet: string | null;
  options: Record<string, string>;
  correct_answer: string;
}

interface QuizData {
  quiz_id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  quiz: Question[];
  quiz_key: string;
  quiz_time: number;
  quiz_expiration_time: string;
}

interface QuizPageProps {
  params: {
    username: string;
    quizId: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

type FormData = {
  name: string;
  email: string;
  quizKey: string;
};

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const { username, quizId } = params;
  const [step, setStep] = useState<'info' | 'instructions' | 'quiz-info' | 'quiz' | 'results'>('info');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    quizKey: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const screenshotIntervalRef = useRef<NodeJS.Timeout>();
  const activityMonitorRef = useRef({ 
    lastActivity: Date.now(), 
    warnings: 0,
    mouseX: 0,
    mouseY: 0,
    lastMouseMove: Date.now(),
    lastKeyPress: Date.now()
  });
  const exitConfirmationRef = useRef(false);

  // Define all functions before they're used
  const handleSubmitQuiz = useCallback(() => {
    setStep('results');
  }, []);

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
    
    // Show the warning toast
    toast.warning(message, {
      style: {
        background: '#92400E',
        color: '#FEF3C7',
        border: '1px solid #B45309',
        maxWidth: '500px',
        margin: '0 auto',
        textAlign: 'center',
        borderRadius: '0.5rem',
        fontSize: '0.95rem',
        padding: '1rem',
        zIndex: 9999,
      },
      duration: 5000,
      position: 'top-center',
      className: 'warning-toast',
    });
    
    // Force focus back to the window
    window.focus();
    
    // Clear any existing timeout
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Hide the warning after 5 seconds
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
    }, 5000);
  }, []);

  // State for custom confirmation dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const exitConfirmResolve = useRef<((value: boolean) => void) | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Custom confirmation dialog
  const confirmExit = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      exitConfirmResolve.current = resolve;
      setShowExitConfirm(true);
    });
  }, []);

  // Handle exit confirmation response
  const handleExitResponse = useCallback((confirmed: boolean) => {
    if (exitConfirmResolve.current) {
      exitConfirmResolve.current(confirmed);
      exitConfirmResolve.current = null;
    }
    setShowExitConfirm(false);
    
    if (!confirmed) {
      // Focus back to the quiz content
      const quizContent = document.getElementById('quiz-content');
      if (quizContent) {
        quizContent.focus();
      }
    }
  }, []);

  // Handle fullscreen change with custom confirmation
  const handleFullscreenChange = useCallback(async () => {
    // Check if we're already handling this change or if the quiz isn't started
    if (exitConfirmationRef.current || !quizStarted || isRestoring) return;
    
    // Check if any fullscreen mode is active (cross-browser compatible)
    const isFullscreen = document.fullscreenElement || 
                        (document as any).webkitFullscreenElement || 
                        (document as any).msFullscreenElement;
    
    if (!isFullscreen) {
      // Prevent multiple dialogs
      exitConfirmationRef.current = true;
      
      try {
        // Store scroll position
        const scrollY = window.scrollY;
        
        // Use custom confirmation dialog
        const userConfirmed = await confirmExit();
        
        if (userConfirmed) {
          // User wants to quit
          handleSubmitQuiz();
          return;
        } else {
          // User wants to continue, re-enter fullscreen with retry logic
          setIsRestoring(true);
          let fullscreenRestored = false;
          
          // Try multiple times to restore fullscreen
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await requestFullscreen();
              // Wait for fullscreen to be fully applied
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Restore scroll position
              window.scrollTo(0, scrollY);
              
              // Force a reflow to ensure everything is properly laid out
              document.body.offsetHeight;
              
              fullscreenRestored = true;
              break;
            } catch (err) {
              console.warn(`Fullscreen restore attempt ${attempt + 1} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          
          if (!fullscreenRestored) {
            // If all retries failed, show error and end quiz
            alert('Could not restore fullscreen mode. The quiz will now end.');
            handleSubmitQuiz();
            return;
          }
        }
      } finally {
        setIsRestoring(false);
        // Reset the flag after a short delay to prevent multiple dialogs
        setTimeout(() => {
          exitConfirmationRef.current = false;
        }, 1000);
      }
    }
  }, [quizStarted, requestFullscreen, handleSubmitQuiz]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enhanced proctoring system with mandatory fullscreen and tab monitoring
  useEffect(() => {
    if (step === 'quiz' && quizStarted) {
      // Request fullscreen when quiz starts
      const enterFullscreen = async () => {
        try {
          await requestFullscreen();
          // Disable exit fullscreen with ESC
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
              e.preventDefault();
              requestFullscreen();
            }
          });
        } catch (err) {
        }
      };
      
      enterFullscreen();

      const handleVisibilityChange = () => {
        if (document.hidden) {
          // End quiz on first violation
          activityMonitorRef.current.warnings = 1;
          showWarningMessage('Quiz terminated due to tab switch!');
          toast.error('Quiz terminated due to violation!', {
            style: { 
              background: '#1F2937', 
              color: '#EF4444', 
              border: '1px solid #374151',
              maxWidth: '500px',
              margin: '0 auto',
              textAlign: 'center',
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              padding: '1rem',
            },
            duration: 10000,
            position: 'top-center',
          });
          // End quiz immediately
          handleSubmitQuiz();
        } else {
          // When coming back to tab, re-request fullscreen
          requestFullscreen();
        }
      };

      // Add event listeners for proctoring
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Prevent context menu (right-click)
      // Prevent context menu (right-click)
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      // Handle keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        // Specifically handle Escape key
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          showWarningMessage('Escape key is disabled during the quiz!');
          return false;
        }

        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
        const forbiddenKeys = [
          'F12',
          'Escape',
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

      // Detect mouse leave window
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 || e.clientX <= 0 || 
            e.clientX >= window.innerWidth || 
            e.clientY >= window.innerHeight) {
          showWarningMessage('Please keep your mouse within the quiz window!');
        }
      };

      // Detect developer tools opening (basic detection)
      const devToolsOpened = () => {
        const threshold = 160; // pixels
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const orientation = widthThreshold ? 'vertical' : 'horizontal';
        
        if (widthThreshold || heightThreshold) {
          showWarningMessage('Developer tools are not allowed during the quiz!');
          // Force close dev tools (may not work in all browsers)
          window.dispatchEvent(new Event('resize'));
          document.body.innerHTML = '';
          window.location.reload();
          return true;
        }
        return false;
      };

      // Check for dev tools periodically
      const devToolsCheck = setInterval(devToolsOpened, 1000);

      // Add event listeners with capture phase for better key blocking
      document.addEventListener('contextmenu', handleContextMenu);
      
      // Add keydown listener with capture phase to catch events early
      const blockEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          showWarningMessage('Escape key is disabled during the quiz!');
          return false;
        }
      };
      
      // Add multiple layers of key blocking
      document.addEventListener('keydown', blockEscapeKey, true); // Capture phase
      document.addEventListener('keydown', handleKeyDown);
      
      // Fullscreen change handlers
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);
      document.addEventListener('mouseleave', handleMouseLeave);
      
      // Global key handler as final defense
      document.onkeydown = function(e) {
        // Block Escape key and other restricted keys
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          e.stopPropagation();
          showWarningMessage('Escape key is disabled during the quiz!');
          return false;
        }
        
        // Block other restricted keys
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) || 
            (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
          e.preventDefault();
          return false;
        }
      };
      
      // Prevent default Escape key behavior on window
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // Disable right click, selection, and copy
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

      // Check fullscreen status periodically
      const checkFullscreen = setInterval(() => {
        if (!document.fullscreenElement && quizStarted && !exitConfirmationRef.current) {
          handleFullscreenChange();
        }
      }, 1000);

      // Cleanup function
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', blockEscapeKey, true);
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
  }, [step, quizStarted, requestFullscreen, showWarningMessage]);

  // Function to shuffle an array using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const verifyQuizKey = async () => {
    if (!formData.quizKey.trim()) {
      setVerificationError('Please enter a quiz key');
      return false;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      // Get the current URL path
      const currentPath = window.location.href;
      
      // First verify the quiz exists and get its details
      const response = await fetch(`https://quizzviz-publish-quiz.up.railway.app/publish/public/quiz/${encodeURIComponent(currentPath)}?key=${encodeURIComponent(formData.quizKey)}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify quiz key');
      }

      const data = await response.json();
      
      if (data.quiz_key !== formData.quizKey) {
        throw new Error('Invalid quiz key. Please check and try again.');
      }
      
      // Shuffle the questions array before setting the state
      if (data.quiz && Array.isArray(data.quiz)) {
        data.quiz = shuffleArray(data.quiz);
      }

      setQuizData(data);
      setTimeLeft(data.quiz_time * 60);
      setStep('instructions');
      return true;
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationError(error.message || 'Failed to verify quiz key');
      toast.error(error.message || 'Failed to verify quiz key', {
        style: { 
          background: '#1F2937', 
          color: '#EF4444', 
          border: '1px solid #374151' 
        }
      });
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyQuizKey();
  };

  const startQuiz = () => {
    setStep('quiz-info');
  };

  const beginQuiz = () => {
    setQuizStarted(true);
    setStep('quiz');
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quizData?.quiz.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };


  // Timer effect
  useEffect(() => {
    if (!quizStarted || step !== 'quiz') return;
    
    if (timeLeft <= 0) {
      handleSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, step, timeLeft]);

  // Calculate score
  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    quizData.quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    
    const total = quizData.quiz.length;
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
      text: `${quizData?.num_questions || 'Multiple'} questions • ${quizData?.quiz_time || 30} minutes`
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

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Exit Confirmation Modal */}
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
      
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Header with Logo */}
      <header className="relative z-20 p-6 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white">
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
              {/* Header - Removed icon */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Welcome to Quiz
                </h1>
                <p className="text-gray-400">Enter your details to begin the assessment</p>
              </div>

              {/* Form Card */}
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmitInfo} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
Full Name                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your Full Name"
                        required
                        className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-400" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                        className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quizKey" className="text-gray-300 font-medium flex items-center gap-2">
                        <Key className="w-4 h-4 text-green-400" />
                        Quiz Key
                      </Label>
                      <Input
                        id="quizKey"
                        name="quizKey"
                        value={formData.quizKey}
                        onChange={handleInputChange}
                        placeholder="Enter the quiz access key"
                        required
                        className="h-12 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20"
                      />
                      {verificationError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                          <p className="text-sm text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {verificationError}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={verifying}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying Access...
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
            </div>
          </div>
        )}

        {step === 'instructions' && quizData && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {quizData?.topic || 'Quiz'}
                </h1>
                <p className="text-gray-400">
                  {quizData?.difficulty ? `${quizData.difficulty.charAt(0).toUpperCase() + quizData.difficulty.slice(1)}` : 'Quiz'}
                </p>
              </div>

              {/* Quiz Info */}
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

              {/* Important Notice */}
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
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span>Your activity is being recorded and monitored</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center">
                <Button 
                  onClick={beginQuiz}
                  className="h-14 w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl text-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Start Quiz
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'quiz' && quizData && (
          <div className="min-h-[calc(100vh-80px)]">
            {/* Progress Header */}
            <div className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-20 z-10">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold text-white">
                    Question {currentQuestionIndex + 1} of {quizData.quiz.length}
                  </div>
                  <div className="text-sm text-gray-400">
                    {Object.keys(selectedAnswers).length} answered
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / quizData.quiz.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-6">
              {/* Question Card */}
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl shadow-2xl mb-6">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6 leading-relaxed">
                    {quizData.quiz[currentQuestionIndex].question}
                  </h2>

                  {/* Code Snippet */}
                  {quizData.quiz[currentQuestionIndex].code_snippet && (
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
                        {quizData.quiz[currentQuestionIndex].code_snippet || ''}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-4">
                    <h3 className="text-white font-medium mb-4">Choose your answer:</h3>
                    {Object.entries(quizData.quiz[currentQuestionIndex].options).map(([key, value]) => {
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

              {/* Navigation - Moved to left side with better positioning */}
              <div className="flex justify-start">
                {currentQuestionIndex < quizData.quiz.length - 1 ? (
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
                    onClick={handleSubmitQuiz}
                    disabled={!selectedAnswers[currentQuestionIndex]}
                    className="h-14 px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg rounded-xl"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'results' && quizData && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              {/* Header */}
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
                  {/* Score Circle */}
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

                  {/* Score Details */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {calculateScore().correct}
                      </div>
                      <div className="text-sm text-gray-400">Correct</div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-red-400 mb-1">
                        {quizData.quiz.length - calculateScore().correct}
                      </div>
                      <div className="text-sm text-gray-400">Incorrect</div>
                    </div>
                    <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {quizData.quiz.length}
                      </div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                  </div>

                  {/* Performance Message */}
                  <div className={`p-6 rounded-xl mb-8 border ${
                    calculateScore().percentage >= 70 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : calculateScore().percentage >= 50 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {calculateScore().percentage >= 70 
                          ? 'Excellent Performance!' 
                          : calculateScore().percentage >= 50 
                            ? 'Good Effort!' 
                            : 'Keep Practicing!'}
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

                  {/* Quiz Summary - Fixed spacing */}
                  <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      Quiz Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Topic:</span>
                        <span className="text-white font-medium">{quizData.topic}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Difficulty:</span>
                        <span className="text-white font-medium capitalize">{quizData.difficulty}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                        <span className="text-gray-400">Questions:</span>
                        <span className="text-white font-medium">{quizData.quiz.length}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">Time Limit:</span>
                        <span className="text-white font-medium">{quizData.quiz_time} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
                    <Button asChild className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <Link href="/" className="flex items-center">
                        <Home className="mr-2 h-5 w-5" />
                        Return to Home
                      </Link>
                    </Button>
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