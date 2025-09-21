import { notFound } from 'next/navigation';
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

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
  const { username, quizId } = params;
  const [step, setStep] = useState<'info' | 'instructions' | 'quiz'>('info');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    quizKey: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('instructions');
  };

  const startQuiz = () => {
    setIsLoading(true);
    // Simulate loading before starting the quiz
    setTimeout(() => {
      setStep('quiz');
      setIsLoading(false);
    }, 1000);
  };

  const quizInstructions = [
    'This quiz contains multiple-choice questions with a time limit for each question.',
    'Once you select an answer, you cannot go back to change it - choose carefully!',
    'Do not switch tabs or minimize your browser during the quiz - it will end your attempt.',
    'Using other devices or applications during the quiz is strictly prohibited.',
    'Your progress is automatically saved, but do not refresh the page.',
    'Ensure you have a stable internet connection before starting.',
    'By starting the quiz, you agree to these conditions and our terms of service.',
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
                <Button type="submit" disabled={!formData.name || !formData.email || !formData.quizKey}>
                  Continue to Instructions
                </Button>
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
              <Button onClick={startQuiz} disabled={isLoading || !acceptedTerms}>
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

        {step === 'quiz' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Quiz Started!</h2>
            <p className="text-muted-foreground">Quiz content will be displayed here.</p>
            <div className="mt-8 p-8 bg-muted/30 rounded-lg border border-border">
              <p className="text-muted-foreground">Quiz interface will be implemented in the next step.</p>
              <p className="mt-2 text-sm text-muted-foreground">(This is a placeholder for the actual quiz interface)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}