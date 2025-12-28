"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Link from "next/link";
import { MoreVertical, Trash2 } from "lucide-react";
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
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";

interface QuizSummary {
  quiz_id: string;
  user_id: string;
  role: string;
  techStack: Array<{name: string; weight: number }>;
  difficulty: string;
  num_questions: number;
  theory_questions_percentage: number;
  code_analysis_questions_percentage: number;
  quiz: string;
  created_at?: string;
  is_publish?: boolean;
  isPublished?: boolean;
  public_link?: string;
}

export default function MyQuizzesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{id: string; name: string; owner_email?: string; } | null>(null);
  const queryClient = useQueryClient();
  
  const { plan, isLoading: isPlanLoading } = useUserPlanContext();
  
  const isBusinessPlan = plan === 'Business';

  // Fetch company info
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!isLoaded || !user) return;
      
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
          
          // The company_id field should be the slug/identifier used in your backend API
          // Check what fields are available in your company object
          setCompanyInfo({
            id: company.company_id || company.id || company.name,
            name: company.name || company.company_id || 'Company',
            owner_email: company.owner_email || user?.emailAddresses?.[0]?.emailAddress

          });
        } else {
          console.warn('No company found for user');
          setFetchError('No company found. Please create a company first.');
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        setFetchError(error instanceof Error ? error.message : 'Failed to load company information');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isLoaded) {
      if (!user) {
        router.push("/signin");
      } else {
        fetchCompanyInfo();
      }
    }
  }, [isLoaded, user, router]);

  // React Query - cache quizzes per company
  const { data: quizzesData, isFetching: rqFetching, error: rqError } = useQuery<QuizSummary[]>({
    queryKey: ["quizzes", companyInfo?.id],
    enabled: Boolean(companyInfo?.id && !isLoading),
    queryFn: async () => {
      const res = await fetch(`/api/quizzes${companyInfo?.id ? `?companyId=${encodeURIComponent(companyInfo.id)}` : ''}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to fetch quizzes (${res.status})`);
      }
      return res.json();
    },
    staleTime: 30000,
  });
  
  useEffect(() => {
    if (quizzesData) {
      setQuizzes(quizzesData);
    }
    setIsFetchingQuizzes(rqFetching);
    setFetchError(rqError ? rqError.message : null);
  }, [quizzesData, rqFetching, rqError]);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!quizId) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete quiz');
      }
      
      await queryClient.invalidateQueries({ queryKey: ['quizzes', companyInfo?.id] });
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
      
      console.log('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to delete quiz');
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading state within the page content
  if (isLoading || !isLoaded || isPlanLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6">
                <div className="flex items-center justify-center h-[50vh]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  // Business Plan UI
  return (
    <DashboardAccess>
      <Head>
        <title>My Quizzes | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="View and manage your created quizzes on QuizzViz." />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold">My Quizzes</h1>
                  <p className="text-white/70">Browse your generated quizzes and open any to view full details.</p>
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
                                  title={q.role}
                                >
                                  {q.role}
                                </CardTitle>
                                {q.role.length > 30 && (
                                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 text-sm text-white bg-gray-800 rounded shadow-lg z-10">
                                    {q.role}
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
    </DashboardAccess>
  );
}