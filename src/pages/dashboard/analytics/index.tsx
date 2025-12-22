"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import Head from "next/head";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable, { HookData } from 'jspdf-autotable';
import { Download, RefreshCcw, Users, Trophy, CheckCircle, Zap, BarChart3, ChevronLeft, ChevronRight, Trash2, X, AlertTriangle } from "lucide-react";
import { toast } from '@/hooks/use-toast';

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

type QuizResult = {
  quiz_id: string;
  owner_id: string;
  username: string;
  user_email: string;
  result: {
    score: number;
    role: string;
    total_questions: number;
    quiz_difficulty?: string;
    [key: string]: any; // For any additional dynamic properties
  };
  attempt: number;
  role: string;
  created_at: string;
  quiz_difficulty?: string;
  total_questions?: number;
};

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#E11D48', '#C026D3', '#F97316', '#22C55E', '#3B82F6', '#6366F1', '#D946EF', '#FCD34D', '#10B981', '#06B6D4', '#7C3AED', '#DB2777', '#FBBF24'];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

const prepareExportData = (data: QuizResult[]) => {
  return data.map(q => ({
    Username: q.username,
    Email: q.user_email,
    Score: q.result.score,
    'Total Questions': q.result.total_questions,
    'Role': q.result.role,
    Attempt: q.attempt,
    'Date Attempted': formatDate(q.created_at)
  }));
};

const exportExcel = (data: QuizResult[]) => {
  const preparedData = prepareExportData(data);
  const worksheet = XLSX.utils.json_to_sheet(preparedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  XLSX.writeFile(workbook, `quiz-results-${new Date().toISOString().split('T')[0]}.xlsx`);
};

const exportPDF = (data: QuizResult[]) => {
  if (data.length === 0) return;
  
  const preparedData = prepareExportData(data);
  // Safely get the quiz role with fallbacks
  const quizRole = (data[0]?.result?.role || data[0]?.role);
  const totalQuestions = data[0]?.result?.total_questions || 0;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`${quizRole} Quiz Results`, 14, 20);
  
  // Add total questions
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Total Questions: ${totalQuestions}`, 14, 30);
  doc.setTextColor(0);
  
  // Add table
  autoTable(doc, {
    startY: 40,
    head: [['Username', 'Email', 'Score', 'Attempt', 'Date Attempted']],
    body: preparedData.map(row => [
      row.Username,
      row.Email,
      row.Score,
      row.Attempt,
      row['Date Attempted']
    ]),
    theme: 'grid',
    headStyles: { 
      fillColor: [79, 70, 229], // Indigo header
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 3,
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap',
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 30 }, // Username
      1: { cellWidth: 50 }, // Email
      2: { cellWidth: 20 }, // Score
      3: { cellWidth: 20 }, // Attempt
      4: { cellWidth: 40 }, // Date
    },
    margin: { left: 14, right: 14 },
    didDrawPage: function(data: HookData) {
      // Add page number
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      const pageNumber = data.pageNumber || 1;
      const pageCount = (doc as any).lastAutoTable?.pageNumber || 1;
      doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }
  });
  
  doc.save(`${quizRole.toLowerCase().replace(/\s+/g, '-')}-results-${new Date().toISOString().split('T')[0]}.pdf`);
};

export default function ResultsDashboard() {
const { user } = useUser();
const { data: userPlan, isLoading: isPlanLoading } = useUserPlan();
const canViewAdvancedAnalytics = userPlan?.plan_name === 'Business';


  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quizData, setQuizData] = useState<QuizResult[]>([]);
  const [selectedScores, setSelectedScores] = useState<{[role:string]: number|null}>({});
  const [isMobile, setIsMobile] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const quizzesPerPage = 5;
  const dataFetched = useRef(false);
  const [selectedUsers, setSelectedUsers] = useState<{ [key: string]: boolean }>({});
  const [showDeleteQuizModal, setShowDeleteQuizModal] = useState<{show: boolean, quizId: string, role: string}>({ show: false, quizId: '', role: '' });
  const [showDeleteUsersModal, setShowDeleteUsersModal] = useState<{show: boolean, quizId: string}>({ show: false, quizId: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Check for mobile screen
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cached data with expiration (1 hour)
  const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
  
  // Function to get cached data
  const getCachedData = (key: string) => {
    if (typeof window === 'undefined') return null;
    
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    try {
      const { data, timestamp } = JSON.parse(cached);
      const now = new Date().getTime();
      
      // Return data if not expired
      if (now - timestamp < CACHE_EXPIRY) {
        return data;
      }
    } catch (e) {
      console.error('Error reading cache:', e);
    }
    return null;
  };
  
  // Function to save data to cache
  const saveToCache = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  };

  // Reset selections when data changes
  useEffect(() => {
    setSelectedUsers({});
  }, [quizData]);

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Check if any users are selected
  const hasSelectedUsers = useMemo(() => {
    return Object.values(selectedUsers).some(selected => selected);
  }, [selectedUsers]);

  // Delete quiz data
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/quiz_result/delete?quiz_id=${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete quiz data');
      }

      // Refresh data after deletion
      await fetchResults(user, true);
      toast({
        title: 'Success',
        description: 'Quiz data deleted successfully',
        variant: 'success',
        className: '!bg-green-600 !text-white !border-green-600',
      });
    } catch (error) {
      console.error('Error deleting quiz data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete quiz data',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteQuizModal({ show: false, quizId: '', role: '' });
    }
  };

  // Delete selected users
  const handleDeleteSelectedUsers = async () => {
    if (!showDeleteUsersModal.quizId) return;
    
    const usersToDelete = Object.entries(selectedUsers)
      .filter(([_, selected]) => selected)
      .map(([userId]) => {
        const [username, email] = userId.split('|');
        return { username, email };
      });

    try {
      setIsDeleting(true);
      const deletePromises = usersToDelete.map(user => {
        const encodedEmail = encodeURIComponent(user.email);
        return fetch(`/api/quiz_result/delete?quiz_id=${showDeleteUsersModal.quizId}&email=${encodedEmail}`, {
          method: 'DELETE',
        });
      });

      const results = await Promise.all(deletePromises);
      
      // Check if any of the requests failed
      const failedResults = results.filter(response => !response.ok);
      if (failedResults.length > 0) {
        const errorData = await Promise.all(failedResults.map(r => r.json().catch(() => ({}))));
        throw new Error(`Failed to delete some results: ${errorData.map(e => e.message).join(', ')}`);
      }
      
      // Refresh data after deletion
      await fetchResults(user, true);
      setSelectedUsers({});
      toast({
        title: 'Success',
        description: 'Selected results deleted successfully',
        variant: 'success',
        className: '!bg-green-600 !text-white !border-green-600',
      });
    } catch (error) {
      console.error('Error deleting user results:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user results',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteUsersModal({ show: false, quizId: '' });
    }
  };

  // Fetch results with caching
  const fetchResults = useCallback(async (currentUser: typeof user, forceRefresh = false) => {
    if (!dataFetched.current) {
      setLoading(true);
    }
    
    try {
      const ownerId = currentUser?.firstName?.toLowerCase().replace(/\s+/g, '');
      if (!ownerId) return;
      
      const cacheKey = `quiz_results_${ownerId}`;
      
      // Try to get cached data first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setQuizData(cachedData);
          setLastUpdated(new Date());
          console.log("Using cached quiz data");
          if (dataFetched.current) return; // Only return if we've already fetched once
        }
      }
      
      // Fetch fresh data from API
      const res = await fetch(`/api/quiz_result?owner_id=${ownerId}`);
      const responseData = await res.json();
      
      // Extract the results array from the response
      const quizResults = responseData.results || [];
      
      // Save to cache and update state
      saveToCache(cacheKey, quizResults);
      setQuizData(quizResults);
      setLastUpdated(new Date());
      console.log("Data successfully loaded from API and cached.", quizResults);
      
    } catch (err) {
      console.error("Failed to fetch data from API:", err);
      // If there's an error, try to use cached data if available
      const cachedData = getCachedData(`quiz_results_${currentUser?.firstName?.toLowerCase().replace(/\s+/g, '')}`);
      if (cachedData) {
        // Make sure to handle both old and new cache formats
        const quizResults = Array.isArray(cachedData) ? cachedData : (cachedData.results || []);
        setQuizData(quizResults);
        setLastUpdated(new Date());
        console.log("Using cached data after API error", quizResults);
      }
    } finally {
      setLoading(false);
      dataFetched.current = true;
    }
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    if (user && !refreshing) {
      setRefreshing(true);
      try {
        await fetchResults(user, true); // Force refresh
      } finally {
        setRefreshing(false);
      }
    }
  }, [user, fetchResults, refreshing]); 

  useEffect(() => {
    // Check if data is loaded, user is available, AND we haven't fetched yet
    if (user && !dataFetched.current) {
        dataFetched.current = true; // Mark as fetched
        fetchResults(user);
    }
  // We only run this when isLoaded or user changes. fetchResults is stable now.
  }, [user, fetchResults]); 

  // Group and bin data by quiz_id with 5% score increments (0-100%)
  const analyticsPerQuiz = useMemo(() => {
    const map = new Map<string, {
      quiz_id: string;
      role: string;
      quiz_difficulty: string;
      total_questions: number;
      created_at: string;
      scores: number[];
      details: QuizResult[];
    }>();
    
    if (!quizData || !Array.isArray(quizData)) {
      return [];
    }

    // Group by quiz_id
    quizData.forEach(q => {
      const quizId = q.quiz_id;
      if (!map.has(quizId)) {
        map.set(quizId, {
          quiz_id: quizId,
          role: q.result.role || q.role,
          quiz_difficulty: q.result.quiz_difficulty || 'Not Specified',
          total_questions: q.result.total_questions || 0,
          created_at: q.created_at,
          scores: [],
          details: []
        });
      }
      const quiz = map.get(quizId)!;
      quiz.scores.push(q.result.score);
      quiz.details.push(q);
    });

    interface GroupedQuizData {
      quiz_id: string;
      role: string;
      quiz_difficulty: string;
      total_questions: number;
      created_at: string;
      scoreDistribution: Array<{
        name: string;
        count: number;
        candidates: QuizResult[];
      }>;
      details: QuizResult[];
    }

    const result: GroupedQuizData[] = [];
    
    // Process each quiz
    map.forEach((quizData, quizId) => {
      const bins: {[key: string]: QuizResult[]} = {};
      // Define 5% bins (0-5, 5-10, ..., 95-100)
      for (let i = 0; i < 100; i += 5) { 
        bins[`${i}-${i+5}%`] = [];
      }
      
      // Distribute candidates into score bins
      quizData.details.forEach(candidate => {
        const score = candidate.result.score;
        const bucketStart = Math.min(Math.floor(score / 5) * 5, 95);
        const bucket = score === 100 ? '95-100%' : `${bucketStart}-${bucketStart+5}%`;
        
        if (bins[bucket]) {
          bins[bucket].push(candidate);
        }
      });
      
      // Convert bins to distribution array
      const distribution = Object.entries(bins)
        .map(([name, candidates]) => ({
          name,
          count: candidates.length,
          candidates
        }))
        .filter(d => d.count > 0); // Only include non-empty buckets
      
      result.push({
        quiz_id: quizId,
        role: quizData.role,
        quiz_difficulty: quizData.quiz_difficulty,
        total_questions: quizData.total_questions,
        created_at: quizData.created_at,
        scoreDistribution: distribution,
        details: quizData.details
      });
    });

    // Sort by most recent first
    return result.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [quizData]);

  // Calculate pagination
  const totalPages = Math.ceil(analyticsPerQuiz.length / quizzesPerPage);
  const paginatedQuizzes = useMemo(() => {
    const startIndex = (currentPage - 1) * quizzesPerPage;
    const endIndex = startIndex + quizzesPerPage;
    return analyticsPerQuiz.slice(startIndex, endIndex);
  }, [analyticsPerQuiz, currentPage, quizzesPerPage]);

  // Reset to page 1 when quiz data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [analyticsPerQuiz.length]);

  // Bottom Pagination component only
  const BottomPaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showEllipsis = totalPages > 7;

      if (!showEllipsis) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        if (currentPage <= 3) {
          // Near start
          pages.push(2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          // Near end
          pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          // Middle
          pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 mt-6">
        <div className="text-sm text-gray-400 order-2 sm:order-1">
          Showing {Math.min((currentPage - 1) * quizzesPerPage + 1, analyticsPerQuiz.length)}-
          {Math.min(currentPage * quizzesPerPage, analyticsPerQuiz.length)} of {analyticsPerQuiz.length} quizzes
        </div>
        
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page as number)}
                  className={`w-9 h-9 p-0 text-sm ${
                    currentPage === page 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                      : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {page}
                </Button>
              )
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head><title>Quiz Analytics | Enterprise</title>
      <link rel="icon" href="/favicon.ico" /></Head>
      <div className="min-h-screen bg-black text-white font-sans">
        <SignedIn>
          <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="bg-zinc-950 border-r border-zinc-800 shrink-0"><DashboardSideBar /></div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <DashboardHeader userName={user?.fullName || "User"} userEmail={user?.emailAddresses?.[0]?.emailAddress}/>
              
              <main className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
                  {/* Loading State for content only */}
                  {(isPlanLoading || loading) && (
                    <div className="flex items-center justify-center py-24">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {/* Plan Gate - show upgrade message when not loading and not eligible */}
                  {!(isPlanLoading || loading) && !canViewAdvancedAnalytics && (
                    <div className="max-w-4xl mx-auto bg-card rounded-xl p-8 mt-12 text-center border border-border shadow-sm">
                      <div className="mb-6">
                        <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold mb-3">Advanced Analytics</h1>
                      <p className="text-muted-foreground mb-2">
                        This feature is available with our <span className="font-semibold text-blue-500">Business plan</span>.
                      </p>
                      <p className="text-muted-foreground/80 mb-8">
                        Upgrade to unlock powerful analytics and insights for your quizzes.
                      </p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 shadow-lg"
                      >
                        <Link href="/pricing" className="flex items-center gap-2">
                        <Zap className="w-4 h-4 mr-2" />
                        Upgrade to Business Plan
                        </Link>
                      </Button>
                    </div>
                  )}
                  {/* Main analytics content - render only when loaded and eligible */}
                  {!(isPlanLoading || loading) && canViewAdvancedAnalytics && (
                  <div>
                  {/* Header Section */}
                  <div className="w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">
                          Quiz Analytics
                        </h1>
                         <p className="text-sm sm:text-lg text-gray-400 mt-1">
                           Analyze candidate performance and identify top talent.
                         </p>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={handleRefresh}
                           disabled={loading || refreshing}
                           className="flex items-center gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                           {refreshing ? 'Refreshing...' : 'Refresh Data'}
                         </Button>
                         {lastUpdated && (
                           <span className="text-xs text-gray-500">
                             Last updated: {lastUpdated.toLocaleTimeString()}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>

                  {/* Empty State */}
                  {analyticsPerQuiz.length === 0 ? (
                    <Card className="bg-zinc-950 border-zinc-800 shadow-xl">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <BarChart3 className="h-16 w-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Quiz Results Yet</h3>
                        <p className="text-gray-500 text-center max-w-md">
                          Once candidates start taking your quizzes, their results will appear here with detailed analytics.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Quiz Cards */}
                      {paginatedQuizzes.map((quiz, idx) => {
                        const selectedScore = selectedScores[quiz.quiz_id] ?? null;
                        
                        // Filter candidates based on the selected score range (showing ALL attempts in that range)
                        const selectedRange = selectedScore !== null 
                          ? quiz.scoreDistribution.find(d => Number(d.name.split('-')[0]) === selectedScore)
                          : null;
                        
                        const filteredCandidates = selectedScore === null 
                          ? quiz.details // Show all attempts if no filter
                          : quiz.details.filter(d => {
                              const score = d.result.score;
                              if (selectedRange) {
                                const [start, end] = selectedRange.name.split('-').map((s:string) => parseInt(s));
                                // Check if the score falls within the selected 5% bucket
                                return score >= start && score <= end; 
                              }
                              return false;
                          });

                        const highestScore = Math.max(...quiz.details.map(d=>d.result.score), 0);
                        
                        // Find the candidate with the highest score to get their correct answers
                        const topCandidate = quiz.details.find(d => d.result.score === highestScore);
                        const topCandidateCorrectAnswers = topCandidate 
                          ? Math.round((topCandidate.result.score / 100) * topCandidate.result.total_questions)
                          : 0;
                        const totalQuestions = topCandidate?.result.total_questions || 0;
                        
                        const totalAttempts = quiz.details.length;
                        const totalUniqueCandidates = new Set(quiz.details.map(d => d.username)).size;
                        const maxCount = Math.max(...quiz.scoreDistribution.map(d=>d.count), 1);


return (
<Card key={idx} className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-xl p-3 sm:p-4 transition-all duration-500 hover:shadow-purple-500/10">
<CardHeader className="flex flex-col sm:flex-row justify-between items-start border-b border-zinc-800 pb-3 mb-4 space-y-2 sm:space-y-0">
<div>
<div className="flex items-center gap-3">
<CardTitle className="text-white text-xl sm:text-2xl md:text-3xl font-semibold">
{quiz.role} Quiz
</CardTitle>
<span className="text-xs bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-3 py-1 rounded-full font-medium shadow-md">
{quiz.quiz_difficulty}
</span>
</div>
<CardDescription className="text-gray-400 mt-2 text-xs sm:text-sm">
Score distribution across all attempts. Click on a bar to filter results.
</CardDescription>
</div>
<Button 
variant="destructive" 
size="default" 
className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2  transition-all duration-200"
onClick={() => setShowDeleteQuizModal({ 
show: true, 
quizId: quiz.details[0]?.quiz_id || '', 
role: quiz.role 
})}
>
<Trash2 className="h-5 w-5" />
<span>Delete Quiz Data</span>
</Button>
</CardHeader>

<CardContent className="space-y-4">
                              
{/* ELEGANT TEXT KPI DISPLAY - Responsive Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4 border-b border-zinc-900">
<div className="flex items-center space-x-2">
<Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0"/>
<p className="text-gray-300 text-xs sm:text-sm">
<span className="font-bold text-white text-base sm:text-lg">{totalAttempts}</span> Attempts 
<span className="text-xs text-gray-500">({totalUniqueCandidates} candidates)</span>
</p>
</div>
<div className="flex items-center space-x-2">
<Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0"/>
<p className="text-gray-300 text-xs sm:text-sm">
<span className="font-bold text-white text-base sm:text-lg">{highestScore.toFixed(2)}%</span> Top Score
</p>
</div>
<div className="flex items-center space-x-2">
<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0"/>
<p className="text-gray-300 text-xs sm:text-sm">
<span className="font-bold text-white text-base sm:text-lg">{topCandidateCorrectAnswers}/{totalQuestions}</span> Correct Answers
<span className="text-xs text-gray-500 ml-1">(top scorer)</span>
</p>
</div>
</div>

                              {/* CHART SECTION - Responsive Height and Margins */}
                       <div className="h-[380px] sm:h-[350px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart 
      data={quiz.scoreDistribution} 
      margin={{ 
        top: 20,
        right: 10,
        bottom: 70,
        left: 0
      }}
      barCategoryGap="8%"
      barGap={0}
    >
      <defs>
        <linearGradient id={`colorGradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.95}/>
          <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.85}/>
        </linearGradient>
        <linearGradient id="colorGradient-selected" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={0.95}/>
          <stop offset="100%" stopColor="#059669" stopOpacity={0.85}/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5}/>
      <XAxis 
        dataKey="name"
        stroke="#71717a" 
        interval={0} 
        angle={-45} 
        textAnchor="end"
        height={90}
        tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
        tickLine={{ stroke: '#52525b' }}
        axisLine={{ stroke: '#52525b' }}
        ticks={Array.from({length: 20}, (_, i) => i * 5).map(n => `${n}-${n+5}%`)}
        tickFormatter={(value) => {
          const [start, end] = value.replace('%', '').split('-').map(Number);
          return `${start}-${end}%`;
        }}
      />
      <YAxis 
        stroke="#71717a" 
        allowDecimals={false} 
        domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} // Add 10% padding on top
        tick={{ fill: '#9ca3af', fontSize: 11 }}
        tickLine={{ stroke: '#52525b' }}
        axisLine={{ stroke: '#52525b' }}
        width={35}
        tickFormatter={(value) => Number.isInteger(value) ? value.toString() : ''} // Only show whole numbers
      /> 
      <Tooltip 
        cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }}
        content={({payload, active}) => {
          if (!active || !payload || !payload.length) return null;
          const data = payload[0].payload;
          const candidates = data.candidates;
          const hasData = candidates.length > 0;
          
          return (
            <div className="bg-zinc-900/98 backdrop-blur-md text-white p-4 rounded-xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 min-w-[220px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-700">
                <p className="font-bold text-lg text-purple-300">{data.name}</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${hasData ? 'bg-purple-600' : 'bg-zinc-700'}`}>
                  {data.count}
                </span>
              </div>
              {hasData ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 font-medium mb-2">Candidates:</p>
                  {candidates.slice(0, 3).map((c:QuizResult, i:number) => (
                    <div key={i} className="flex items-start justify-between gap-2 bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-xs text-gray-300 truncate flex-1">{c.username}</span>
                      <span className="text-xs font-bold text-purple-400 whitespace-nowrap">{c.result.score.toFixed(1)}%</span>
                    </div>
                  ))}
                  {candidates.length > 3 && (
                    <p className="text-xs text-purple-400 mt-2 font-semibold text-center pt-2 border-t border-zinc-700">
                      +{candidates.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No attempts in this range</p>
              )}
            </div>
          );
        }}
      />
      <Bar 
        dataKey="count" 
        radius={[8, 8, 0, 0]}
        maxBarSize={45}
        onClick={(data) => {
          if (data && data.count > 0) {
            const scoreRange = data.name.split('-');
            const startScore = parseInt(scoreRange[0]);
            setSelectedScores({
              ...selectedScores,
              [quiz.quiz_id]: selectedScores[quiz.quiz_id] === startScore ? null : startScore
            });
          }
        }}
      >
        {Array.from({length: 20}, (_, i) => {
          const start = i * 5;
          const end = start + 5;
          const rangeKey = `${start}-${end}%`;
          const entry = quiz.scoreDistribution.find(d => d.name === rangeKey) || { name: rangeKey, count: 0 };
          const isSelected = selectedScores[quiz.quiz_id] === start;
          const hasData = entry.count > 0;
          
          return (
            <Cell 
              key={`cell-${i}`}
              fill={
                isSelected 
                  ? 'url(#colorGradient-selected)' 
                  : hasData 
                    ? `url(#colorGradient-${idx})` 
                    : 'rgba(39, 39, 42, 0.3)'
              }
              style={{
                opacity: isSelected ? 1 : (hasData ? 1 : 0.3),
                filter: isSelected ? 'url(#glow)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                // Fallback solid colors
                fill: isSelected ? '#10B981' : (hasData ? '#8B5CF6' : 'rgba(39, 39, 42, 0.3)')
              }}
              onMouseEnter={(e) => {
                if (hasData) {
                  e.currentTarget.style.filter = isSelected 
                    ? 'url(#glow)' 
                    : 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.5)) brightness(1.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasData) {
                  e.currentTarget.style.filter = isSelected ? 'url(#glow)' : 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            />
          );
        })}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  {/* Reset filter button */}
  {selectedScore !== null && (
    <div className="mt-4 flex justify-center">
      <Button 
        onClick={() => setSelectedScores({
          ...selectedScores,
          [quiz.quiz_id]: null
        })} 
        className="flex items-center gap-2 bg-zinc-900 border-2 border-purple-500/50 hover:border-purple-400 hover:bg-zinc-800 text-purple-300 hover:text-purple-200 text-sm px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/30"
      >
        <RefreshCcw className="w-4 h-4"/> 
        Clear Filter ({selectedScore}-{selectedScore+5}%)
      </Button>
    </div>
  )}
</div>
                              {/* TABLE SECTION - Responsive */}
                              <div className="space-y-4 pt-2 sm:pt-2 border-t border-zinc-900">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white border-l-4 border-purple-500 pl-3">
                                    Candidate Details {selectedScore !== null && <span className="text-xs sm:text-sm md:text-base font-normal text-purple-400"> (Filtered)</span>}
                                  </h2>
                                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    {hasSelectedUsers && (
                                      <Button 
                                        onClick={() => setShowDeleteUsersModal({ show: true, quizId: quiz.details[0]?.quiz_id || '' })}
                                        variant="destructive"
                                        className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 text-xs sm:text-sm px-3 py-2"
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4"/>
                                        <span>Delete ({Object.values(selectedUsers).filter(Boolean).length})</span>
                                      </Button>
                                    )}
                                    <Button 
                                      onClick={()=>exportExcel(filteredCandidates)} 
                                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 flex-1 sm:flex-initial"
                                    >
                                      <Download className="h-3 w-3 sm:h-4 sm:w-4"/> Excel ({filteredCandidates.length})
                                    </Button>
                                    <Button 
                                      onClick={()=>exportPDF(filteredCandidates)} 
                                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 flex-1 sm:flex-initial"
                                    >
                                      <Download className="h-3 w-3 sm:h-4 sm:w-4"/> PDF ({filteredCandidates.length})
                                    </Button>
                                  </div>
                                </div>
                                {/* Scrollable Table Container - Responsive */}
                                <div className="max-h-[300px] sm:max-h-[400px] overflow-x-auto overflow-y-auto border border-zinc-800 rounded-xl"> 
                                  <Table>
                                    <TableHeader className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-700">
                                      <TableRow className="hover:bg-zinc-900">
                                        <TableHead className="text-xs sm:text-sm">Username</TableHead>
                                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Email</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Score</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Attempt</TableHead>
                                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {filteredCandidates.length > 0 ? (
                                        // Sorting by score descending for the table
                                        filteredCandidates.sort((a, b) => b.result.score - a.result.score).map((c:QuizResult, index:number)=>(
                                        <TableRow key={`${c.quiz_id}-${c.username}-${c.user_email}-${c.attempt}`} className="bg-zinc-950 border-zinc-800 text-gray-300 hover:bg-zinc-800/80 transition-colors duration-200">
                                          <TableCell className="font-medium text-xs sm:text-sm">
                                            <div className="flex items-center gap-2">
                                              <input 
                                                type="checkbox" 
                                                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-zinc-900"
                                                checked={!!selectedUsers[`${c.username}|${c.user_email}`]}
                                                onChange={() => toggleUserSelection(`${c.username}|${c.user_email}`)}
                                              />
                                              {c.username}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-xs sm:text-sm hidden md:table-cell truncate max-w-[150px]">{c.user_email}</TableCell>
                                          <TableCell>
                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-md whitespace-nowrap ${
                                              c.result.score >= 90 ? "bg-green-600 text-white" :
                                              c.result.score >= 70 ? "bg-cyan-600 text-white" :
                                              c.result.score >= 50 ? "bg-yellow-500 text-black" :
                                              "bg-red-500 text-white"
                                            }`}>{c.result.score.toFixed(1)}%</span>
                                          </TableCell>
                                          <TableCell className="text-xs sm:text-sm">{c.attempt}</TableCell>
                                          <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{formatDate(c.created_at)}</TableCell>
                                        </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base md:text-lg">
                                            {selectedScore !== null 
                                              ? `No attempts found for the selected score range.`
                                              : "No quiz results found yet."
                                            }
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                            </CardContent>
                          </Card>
                        );
                      })}
                      
                       
                          <BottomPaginationControls />
                        </>
                      )}
                    </div>
                  )}
                </div>                </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen bg-black text-white px-4">
            <p className="text-base sm:text-xl text-gray-400 text-center">Please sign in to view your quiz analytics.</p>
          </div>
        </SignedOut>
      </div>

      {/* Delete Quiz Confirmation Modal */}
      {showDeleteQuizModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Quiz Data
              </h3>
              <button 
                onClick={() => setShowDeleteQuizModal({ show: false, quizId: '', role: '' })}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-8 text-center">
              This will permanently delete all data for <span className="font-semibold text-white">{showDeleteQuizModal.role} Quiz</span>.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteQuizModal({ show: false, quizId: '', role: '' })}
                className="border-zinc-700 hover:bg-zinc-800 text-white px-6"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteQuiz(showDeleteQuizModal.quizId)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 px-6 shadow-lg hover:shadow-red-500/30"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Users Confirmation Modal */}
      {showDeleteUsersModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Selected Results
              </h3>
              <button 
                onClick={() => setShowDeleteUsersModal({ show: false, quizId: '' })}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-8 text-center">
              This will permanently delete <span className="font-semibold text-white">{Object.values(selectedUsers).filter(Boolean).length} selected result{Object.values(selectedUsers).filter(Boolean).length !== 1 ? 's' : ''}</span>.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteUsersModal({ show: false, quizId: '' })}
                className="border-zinc-700 hover:bg-zinc-800 text-white px-6"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteSelectedUsers}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 px-6 shadow-lg hover:shadow-red-500/30"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}