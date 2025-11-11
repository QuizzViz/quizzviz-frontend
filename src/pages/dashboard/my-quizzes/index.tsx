"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Link from "next/link";
import { Zap, BookOpenCheck, MoreVertical, Trash2 } from "lucide-react";
import { useUserPlanContext } from "@/contexts/UserPlanContext";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuizSummary {
  quiz_id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz: string; // JSON string of questions
  created_at?: string;
  is_publish?: boolean;
  isPublished?: boolean; // For backward compatibility
  public_link?: string; // For sharing published quizzes
}

export default function MyQuizzesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  
  // Get user's plan from context
  const { plan, isLoading: isPlanLoading } = useUserPlanContext();
  
  const isFreePlan = plan === 'Free';
  const isConsumerPlan = plan === 'Consumer';
  const isBusinessPlan = plan === 'Business';
  const isElitePlan = plan === 'Elite';

  useEffect(() => {
    if (isLoaded && !user) router.push("/signin");
    else if (isLoaded) setIsLoading(false);
  }, [isLoaded, user, router]);

  // React Query - cache quizzes per user
  const { data: quizzesData, isLoading: rqLoading, isFetching: rqFetching, error: rqError } = useQuery<QuizSummary[]>({
    queryKey: ["quizzes", user?.id],
    enabled: Boolean(isLoaded && user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/quizzes?userId=${encodeURIComponent(user!.id)}`);
      if (!res.ok) throw new Error((await res.text()) || `Failed to fetch quizzes (${res.status})`);
      return res.json();
    },
    staleTime: Infinity,
  });
  useEffect(() => {
    if (quizzesData) setQuizzes(quizzesData);
    setIsFetchingQuizzes(rqFetching);
    setFetchError(rqError ? (rqError as Error).message : null);
  }, [quizzesData, rqFetching, rqError]);

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete quiz');
      }
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['quizzes', user?.id] });
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
      
      // Show success message (you might want to use a toast notification here)
      console.log('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      // You might want to show a toast notification here with the error message
      alert(error instanceof Error ? error.message : 'Failed to delete quiz');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show Free/Consumer plan UI if user is not on Business plan
  if (isFreePlan || isConsumerPlan || isElitePlan) {
    return (
      <>
        <Head>
          <title>My Quizzes | QuizzViz</title>
          <link rel="icon" href="/favicon.ico" />
          <meta name="description" content="View and take your quizzes" />
        </Head>
        <div className="min-h-screen bg-black text-white">
          <SignedIn>
            <div className="flex min-h-screen">
              {/* Sidebar */}
              <div className="bg-white border-r border-white">
                <DashboardSideBar />
              </div>
              {/* Main content */}
              <div className="flex-1 flex flex-col">
                <DashboardHeader 
                  userName={user?.fullName || user?.firstName || "User"} 
                  userEmail={user?.emailAddresses?.[0]?.emailAddress} 
                />
                <main className="flex-1 p-6">
                  <div className="max-w-5xl mx-auto">
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold mb-2">My Quizzes</h1>
                      <p className="text-white/70">Click on any quiz below to attempt it</p>
                    </div>
                    
                    {fetchError ? (
                      <div className="border border-red-500/40 text-red-300 rounded-lg p-4">
                        {fetchError}
                      </div>
                    ) : isFetchingQuizzes && !quizzes ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : !quizzes || quizzes.length === 0 ? (
                      <div className="border border-white/10 rounded-lg p-6 text-center">
                        <p className="text-white/70">No quizzes available to attempt yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {quizzes.map((q) => {
                          const quizLink = `/quiz/attempt/${q.quiz_id}`;
                          
                          return (
                            <div key={q.quiz_id} className="group relative">
                            <Card className="relative overflow-hidden cursor-pointer border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-blue-500/10 group-hover:border-blue-500/30">
                              {/* Three-dot menu with better visibility */}
                              <div className="absolute top-4 right-4 z-10 transition-opacity opacity-0 group-hover:opacity-100">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all duration-200 shadow-lg hover:shadow-blue-500/20"
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label="Quiz options"
                                    >
                                      <MoreVertical className="h-5 w-5 text-white/80 hover:text-white" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent 
                                    align="end" 
                                    className="bg-zinc-900/95 backdrop-blur-sm border-white/10 w-48 p-1.5 space-y-1"
                                    sideOffset={8}
                                  >
                                    <DropdownMenuItem 
                                      className="flex items-center px-3 py-2.5 text-sm rounded-md text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 cursor-pointer transition-colors duration-150"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setQuizToDelete(q.quiz_id);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2.5 h-4 w-4 flex-shrink-0" />
                                      <span>Delete Quiz</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {/* Always visible menu indicator on hover */}
                              <div className="absolute top-4 right-4 z-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/30 animate-pulse"></div>
                              </div>
                              <Link href={quizLink} className="block group-has-[button:hover]:opacity-90 transition-opacity duration-200">
                                <div 
                                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_circle_at_var(--x,50%)_var(--y,50%),rgba(59,130,246,0.1),transparent_60%)]" 
                                  style={{
                                    '--x': '50%',
                                    '--y': '50%',
                                  } as React.CSSProperties}
                                />
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <div className="relative group">
                                      <CardTitle 
                                        className="text-xl font-semibold text-white truncate max-w-[200px]"
                                        title={q.topic}
                                      >
                                        {q.topic}
                                      </CardTitle>
                                      {q.topic.length > 30 && (
                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 text-sm text-white bg-gray-800 rounded shadow-lg z-10">
                                          {q.topic}
                                        </div>
                                      )}
                                    </div>
                                    <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30">{q.difficulty.replace('Level', '')}</Badge>
                                  </div>
                                  <CardDescription className="text-white/70">
                                    <span className="font-medium text-white">{q.num_questions}</span> questions
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap gap-2">
                                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs">
                                        Theory {q.theory_questions_percentage}%
                                      </span>
                                      <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-300 text-xs">
                                        Code {q.code_analysis_questions_percentage}%
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                                        Click to attempt
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Link>
                            </Card>
                          </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {isFreePlan && (
                      <div className="mt-8 border-t border-white/10 pt-6">
                        <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 p-6 rounded-lg">
                          <h3 className="text-lg font-medium mb-2">Upgrade to Consumer Plan</h3>
                          <p className="text-sm text-white/70 mb-4">
                            Get access to view correct answers after completing quizzes and more advanced features.
                          </p>
                          <Button 
                            onClick={() => router.push('/pricing')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Upgrade Now
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </main>
              </div>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">Redirecting to sign in...</h1>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            </div>
          </SignedOut>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                <AlertDialogDescription className="text-white/70">
                  Are you sure you want to delete this quiz? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-white/20 hover:bg-white/10">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => quizToDelete && handleDeleteQuiz(quizToDelete)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Quizzes | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />

        <meta
          name="description"
          content="View and manage your created quizzes on QuizzViz."
        />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            {/* Main content */}
            <div className="flex-1 flex flex-col">
              <DashboardHeader
                userName={user?.fullName || user?.firstName || "User"}
                userEmail={user?.emailAddresses?.[0]?.emailAddress}
              />
              <main className="flex-1 p-6 pt-10 space-y-6">{/* extra top padding for elegance */}
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold">My Quizzes</h1>
                    <p className="text-white/70">Browse your generated quizzes and open any to view full details.</p>
                  </div>
                </div>
                {fetchError ? (
                  <div className="border border-red-500/40 text-red-300 rounded-lg p-4">
                    {fetchError}
                  </div>
                ) : isFetchingQuizzes && !quizzes ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : !quizzes || quizzes.length === 0 ? (
                  <div className="border border-white/10 rounded-lg p-6">No quizzes to show yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {quizzes.map((q) => (
                      <Link
                        key={q.quiz_id}
                        href={`/quiz/${q.quiz_id}`}
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <Card className="relative overflow-hidden cursor-pointer border-white/10 bg-gradient-to-br from-zinc-950 to-zinc-900 transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-blue-500/10 group-hover:border-white/20">
                          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[radial-gradient(600px_circle_at_var(--x,50%)_var(--y,50%),rgba(59,130,246,0.08),transparent_40%)]" />
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="relative group">
                                <CardTitle 
                                  className="text-xl font-semibold text-white truncate max-w-[200px]"
                                  title={q.topic}
                                >
                                  {q.topic}
                                </CardTitle>
                                {q.topic.length > 30 && (
                                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 text-sm text-white bg-gray-800 rounded shadow-lg z-10">
                                    {q.topic}
                                  </div>
                                )}
                              </div>
                              <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30">{q.difficulty.replace('Level', '')}</Badge>
                            </div>
                            <CardDescription className="text-white/70">
                              <span className="font-medium text-white">{q.num_questions}</span> questions
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs">
                                  Theory {q.theory_questions_percentage}%
                                </span>
                                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-300 text-xs">
                                  Code {q.code_analysis_questions_percentage}%
                                </span>
                              </div>
                              
                              {/* Show Published/Unpublished status */}
                              <div className="mt-1">
                                {q.is_publish || q.isPublished ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Published
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    Not Published
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">Redirecting to sign in...</h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        </SignedOut>
      </div>
    </>
  );
}
