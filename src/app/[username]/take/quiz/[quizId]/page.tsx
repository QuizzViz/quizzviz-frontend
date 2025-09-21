'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
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
  const [step, setStep] = useState<'info' | 'instructions' | 'quiz' | 'results'>('info');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const verifyQuizKey = async () => {
    if (!formData.quizKey.trim()) {
      setVerificationError('Please enter a quiz key');
      return false;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz data');
      }

      const data = await response.json();
      
      if (data.quiz_key !== formData.quizKey) {
        throw new Error('Invalid quiz key');
      }

      setQuizData(data);
      setTimeLeft(data.quiz_time * 60); // Convert minutes to seconds
      setStep('instructions');
      toast.success('Quiz key verified successfully!');
      return true;
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationError(error.message || 'Failed to verify quiz key');
      toast.error(error.message || 'Failed to verify quiz key');
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

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setStep('results');
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
    `This quiz contains ${quizData?.num_questions || 'multiple'}-choice questions with a time limit of ${quizData?.quiz_time || 30} minutes.`,
    'Once you select an answer, you can review and change it before submitting the quiz.',
    'The timer will continue running even if you close the browser - use your time wisely!',
    'Using other devices or applications during the quiz is strictly prohibited.',
    'Your progress is automatically saved, but do not refresh the page.',
    'Ensure you have a stable internet connection before starting.',
    `Quiz Topic: ${quizData?.topic || 'N/A'}`,
    `Difficulty: ${quizData?.difficulty || 'N/A'}`,
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/" className="text-xl sm:text-2xl font-semibold text-foreground">
              QuizzViz
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 pt-8 max-w-2xl">
        {step === 'info' && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Enter Your Details</CardTitle>
              <CardDescription>
                Please provide the following information to start the quiz
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitInfo}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quizKey">Quiz Key</Label>
                  <Input
                    id="quizKey"
                    name="quizKey"
                    type="text"
                    required
                    value={formData.quizKey}
                    onChange={handleInputChange}
                    placeholder="Enter the quiz key provided to you"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!formData.name || !formData.email || !formData.quizKey || verifying}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Continue to Instructions'
                  )}
                </Button>
                {verificationError && (
                  <p className="text-sm text-red-500 mt-2">{verificationError}</p>
                )}
              </CardFooter>
            </form>
          </Card>
        )}

        {step === 'instructions' && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Quiz Instructions</CardTitle>
              <CardDescription>Please read the instructions carefully before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">About This Quiz</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {quizInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium mb-2">Your Information:</h4>
                <p><span className="font-medium">Name:</span> {formData.name}</p>
                <p><span className="font-medium">Email:</span> {formData.email}</p>
                <p><span className="font-medium">Quiz Key:</span> {formData.quizKey}</p>
                
                <div className="flex items-start space-x-2 pt-2 mt-4 border-t border-border/50">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    required
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-snug text-foreground/90"
                  >
                    I understand and agree to the quiz conditions and terms of service. I will not switch tabs/devices during the quiz.
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('info')}>
                Back
              </Button>
              <Button 
                onClick={startQuiz} 
                disabled={isLoading || !acceptedTerms || !quizData}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Quiz'
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'quiz' && quizData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Time Left: {formatTime(timeLeft)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {quizData.quiz.length}
              </div>
            </div>

            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {quizData.quiz[currentQuestionIndex].type === 'code_analysis' ? 'Code Analysis' : 'Theory'}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {Math.round(((currentQuestionIndex + 1) / quizData.quiz.length) * 100)}% Complete
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{quizData.quiz[currentQuestionIndex].question}</h3>
                  
                  {quizData.quiz[currentQuestionIndex].code_snippet && (
                    <div className="rounded-md overflow-hidden border border-border">
                      <SyntaxHighlighter 
                        language="python" 
                        style={atomDark}
                        showLineNumbers
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                        }}
                      >
                        {quizData.quiz[currentQuestionIndex].code_snippet || ''}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    {Object.entries(quizData.quiz[currentQuestionIndex].options).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleAnswerSelect(key)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          selectedAnswers[currentQuestionIndex] === key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 border ${
                            selectedAnswers[currentQuestionIndex] === key
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-muted-foreground/30'
                          }`}>
                            {String.fromCharCode(64 + parseInt(key) + (key >= 'A' ? 0 : 1))}
                          </div>
                          <span>{value}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                {currentQuestionIndex < quizData.quiz.length - 1 ? (
                  <Button 
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQuestionIndex]}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmitQuiz}
                    disabled={!selectedAnswers[currentQuestionIndex]}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Quiz
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 'results' && quizData && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Quiz Completed!</h2>
              <p className="text-muted-foreground">
                You've finished the quiz on {quizData.topic}.
              </p>
            </div>

            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle>Your Results</CardTitle>
                <CardDescription>
                  Here's how you performed on the quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-border">
                    <div className="text-4xl font-bold">{calculateScore().correct}</div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-border">
                    <div className="text-4xl font-bold">{quizData.quiz.length - calculateScore().correct}</div>
                    <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-border">
                    <div className="text-4xl font-bold">{calculateScore().percentage}%</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="font-medium">Question Review</h3>
                  <div className="space-y-4">
                    {quizData.quiz.map((question, index) => {
                      const isCorrect = selectedAnswers[index] === question.correct_answer;
                      return (
                        <div 
                          key={question.id} 
                          className={`p-4 rounded-lg border ${
                            isCorrect 
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50'
                              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                {isCorrect ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className="font-medium">
                                  Question {index + 1}: {question.question}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="pl-7 text-sm">
                                  <p className="text-muted-foreground">
                                    Your answer: <span className="text-red-600 dark:text-red-400">
                                      {selectedAnswers[index] ? question.options[selectedAnswers[index]] : 'Not answered'}
                                    </span>
                                  </p>
                                  <p className="text-muted-foreground">
                                    Correct answer: <span className="text-green-600 dark:text-green-400">
                                      {question.options[question.correct_answer]}
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button asChild>
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}