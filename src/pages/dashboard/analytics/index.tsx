"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable, { HookData } from 'jspdf-autotable';
import { Download, RefreshCcw, Users, Trophy, CheckCircle, Zap, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLAN_TYPE } from "@/config/plans";


type QuizResult = {
  quiz_id: string;
  owner_id: string;
  username: string;
  user_email: string;
  result: {
    score: number;
    quiz_topic: string;
    total_questions: number;
  };
  attempt: number;
  created_at: string;
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
    'Quiz Topic': q.result.quiz_topic,
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
  const quizTopic = data[0].result.quiz_topic;
  const totalQuestions = data[0].result.total_questions;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`${quizTopic} Quiz Results`, 14, 20);
  
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
  
  doc.save(`${quizTopic.toLowerCase().replace(/\s+/g, '-')}-results-${new Date().toISOString().split('T')[0]}.pdf`);
};

export default function ResultsDashboard() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quizData, setQuizData] = useState<QuizResult[]>([]);
  const [selectedScores, setSelectedScores] = useState<{[quiz:string]: number|null}>({});
  const [isMobile, setIsMobile] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const quizzesPerPage = 5;
  const dataFetched = useRef(false);

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
      const data = await res.json();
      
      // Save to cache and update state
      saveToCache(cacheKey, data);
      setQuizData(data);
      setLastUpdated(new Date());
      console.log("Data successfully loaded from API and cached.");
      
    } catch (err) {
      console.error("Failed to fetch data from API:", err);
      // If there's an error, try to use cached data if available
      const cachedData = getCachedData(`quiz_results_${currentUser?.firstName?.toLowerCase().replace(/\s+/g, '')}`);
      if (cachedData) {
        setQuizData(cachedData);
        setLastUpdated(new Date());
        console.log("Using cached data after API error");
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
    if (isLoaded && user && !dataFetched.current) {
        dataFetched.current = true; // Mark as fetched
        fetchResults(user);
    }
  // We only run this when isLoaded or user changes. fetchResults is stable now.
  }, [isLoaded, user, fetchResults]); 

  // Group and bin data by quiz topic with 5% increments (0-100%)
  const analyticsPerQuiz = useMemo(() => {
    const map = new Map<string, {scores: number[], details: QuizResult[] }>();
    quizData.forEach(q => {
      const topic = q.result.quiz_topic;
      if (!map.has(topic)) map.set(topic, {scores: [], details: []});
      map.get(topic)!.scores.push(q.result.score);
      map.get(topic)!.details.push(q);
    });

    const result: {quiz_topic:string, scoreDistribution:any[], details:QuizResult[]}[] = [];
    map.forEach((value, key) => {
      const bins: {[key:string]: QuizResult[]} = {};
      // Define 5% bins (0-5, 5-10, ..., 95-100)
      for(let i=0;i<100;i+=5){ bins[`${i}-${i+5}%`] = []; }
      
      value.details.forEach(c => {
        const score = c.result.score;
        // Determine the bucket index (0-19)
        const bucketStart = Math.min(Math.floor(score / 5) * 5, 95); 
        const bucket = `${bucketStart}-${bucketStart+5}%`;
        
        if (score === 100) {
             bins['95-100%'].push(c);
        } else if (bins[bucket]) {
            bins[bucket].push(c);
        }
      });
      
      const distribution = Object.entries(bins).map(([name, candidates])=>({name, count: candidates.length, candidates}));
      result.push({quiz_topic: key, scoreDistribution: distribution, details: value.details});
    });

    return result;
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

   if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-gray-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (PLAN_TYPE !== "Business") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SignedIn>
          <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="bg-background border-r border-border shrink-0">
              <DashboardSideBar />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <DashboardHeader 
                userName={user?.fullName || 'User'} 
                userEmail={user?.primaryEmailAddress?.emailAddress} 
              />
              
              {/* Upgrade Message */}
              <main className="flex-1 p-6">
                <div className="max-w-4xl mx-auto bg-card rounded-xl p-8 mt-12 text-center border border-border shadow-sm">
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl font-bold mb-3">
                    Advanced Analytics
                  </h1>
                  
                  <p className="text-muted-foreground mb-2">
                    This feature is available with our <span className="font-semibold text-blue-500">Business plan</span>.
                  </p>
                  
                  <p className="text-muted-foreground/80 mb-8">
                    Upgrade to unlock powerful analytics and insights for your quizzes.
                  </p>
                  
                  <Button 
                    onClick={() => {
                      // Add your upgrade navigation logic here
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 shadow-lg"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Business Plan
                  </Button>
                </div>
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }
 
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
                        const selectedScore = selectedScores[quiz.quiz_topic] ?? null;
                        
                        // Filter candidates based on the selected score range (showing ALL attempts in that range)
                        const selectedRange = quiz.scoreDistribution.find(d => Number(d.name.split('-')[0]) === selectedScore);
                        
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
                        const totalUniqueCandidates = Array.from(new Set(quiz.details.map(d=>d.user_email))).length;
                        const maxCount = Math.max(...quiz.scoreDistribution.map(d=>d.count), 1);

                        return (
                          <Card key={idx} className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-xl p-3 sm:p-4 transition-all duration-500 hover:shadow-purple-500/10">
                            <CardHeader className="flex flex-col sm:flex-row justify-between items-start border-b border-zinc-800 pb-3 mb-4 space-y-2 sm:space-y-0">
                              <div>
                                <CardTitle className="text-white text-xl sm:text-2xl md:text-3xl font-semibold">{quiz.quiz_topic} Quiz</CardTitle>
                                <CardDescription className="text-gray-400 mt-1 text-xs sm:text-sm">Score distribution across all attempts. Click on a bar to filter results.</CardDescription>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              
                              {/* ELEGANT TEXT KPI DISPLAY - Responsive Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4 border-b border-zinc-900">
                                  <div className="flex items-center space-x-2">
                                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0"/>
                                      <p className="text-gray-300 text-xs sm:text-sm">
                                          <span className="font-bold text-white text-base sm:text-lg">{totalAttempts}</span> Total Attempts 
                                          <span className="text-xs text-gray-500"> ({totalUniqueCandidates} unique)</span>
                                      </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0"/>
                                      <p className="text-gray-300 text-xs sm:text-sm">
                                          <span className="font-bold text-white text-base sm:text-lg">{highestScore.toFixed(2)}%</span> Highest Score
                                      </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0"/>
                                      <p className="text-gray-300 text-xs sm:text-sm">
                                          <span className="font-bold text-white text-base sm:text-lg">{topCandidateCorrectAnswers}/{totalQuestions}</span> Correct Answers
                                          <span className="text-xs text-gray-500"> (top scorer)</span>
                                      </p>
                                  </div>
                              </div>

                              {/* CHART SECTION - Responsive Height and Margins */}
                              <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={quiz.scoreDistribution} 
                                    margin={{ 
                                      top: 10, 
                                      right: 10, 
                                      left: -10, 
                                      bottom: isMobile ? 100 : 80 
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
                                    <XAxis 
                                      dataKey="name" 
                                      stroke="#71717a" 
                                      interval={isMobile ? 1 : 0} 
                                      angle={isMobile ? -90 : -45} 
                                      textAnchor="end"
                                      height={isMobile ? 100 : 80}
                                      tick={{ fill: '#a1a1aa', fontSize: isMobile ? 8 : 9 }}
                                      className="text-[8px] sm:text-[10px]"
                                    />
                                    <YAxis 
                                      stroke="#71717a" 
                                      allowDecimals={false} 
                                      domain={[0, maxCount]}
                                      tick={{ fontSize: 10 }}
                                      width={40}
                                    /> 
                                    <Tooltip content={({payload}) => {
                                      if (!payload || !payload.length) return null;
                                      const candidates = payload[0].payload.candidates;
                                      return (
                                        <div className="bg-zinc-800/95 backdrop-blur-sm text-white p-3 rounded-lg border border-zinc-700 max-w-[200px] sm:max-w-xs shadow-2xl">
                                          <p className="font-bold text-sm sm:text-base text-purple-300">{payload[0].name}</p>
                                          <p className="text-xs sm:text-sm mt-1">Attempts: <span className="font-semibold">{payload[0].value}</span></p>
                                          {candidates.slice(0,2).map((c:QuizResult)=> <p key={c.quiz_id} className="text-[10px] sm:text-xs text-gray-300 mt-0.5 truncate">{c.username} ({c.result.score.toFixed(1)}%)</p>)}
                                          {candidates.length > 2 && <p className="text-[10px] sm:text-xs text-purple-400 mt-1">+{candidates.length-2} more...</p>}
                                        </div>
                                      );
                                    }}/>
                                    <Bar 
                                      dataKey="count" 
                                      radius={[6, 6, 0, 0]}
                                      onClick={(data)=>setSelectedScores({...selectedScores, [quiz.quiz_topic]: Number(data.name.split('-')[0])})}>
                                      {quiz.scoreDistribution.map((entry, index)=>(
                                          <Cell 
                                              key={index} 
                                              fill={selectedScore !== null && Number(entry.name.split('-')[0]) === selectedScore ? '#FFFFFF' : COLORS[index%COLORS.length]} 
                                              className="transition-all duration-300 cursor-pointer hover:opacity-80"
                                          />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                                {/* Reset filter button - Responsive positioning */}
                                {selectedScore !== null && (
                                  <div className="mt-2 sm:mt-2 flex justify-center lg:justify-start">
                                      <Button 
                                        onClick={()=>setSelectedScores({...selectedScores, [quiz.quiz_topic]: null})} 
                                        className="flex items-center gap-2 text-purple-400 hover:bg-zinc-800 bg-transparent hover:text-white text-xs sm:text-sm px-3 py-2"
                                      >
                                          <RefreshCcw className="w-3 h-3 sm:w-4 sm:h-4"/> Reset Filter ({selectedScore}-{selectedScore+5}%)
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
                                    <Button 
                                      onClick={()=>exportExcel(filteredCandidates)} 
                                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg hover:shadow-purple-500/50 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 flex-1 sm:flex-initial"
                                    >
                                      <Download className="h-3 w-3 sm:h-4 sm:w-4"/> Excel ({filteredCandidates.length})
                                    </Button>
                                    <Button 
                                      onClick={()=>exportPDF(filteredCandidates)} 
                                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg hover:shadow-purple-500/50 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 flex-1 sm:flex-initial"
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
                                        <TableRow key={c.quiz_id} className="bg-zinc-950 border-zinc-800 text-gray-300 hover:bg-zinc-800/80 transition-colors duration-200">
                                          <TableCell className="font-medium text-xs sm:text-sm">{c.username}</TableCell>
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
                      
                      {/* Bottom Pagination */}
                      <BottomPaginationControls />
                    </>
                  )}
                </div>
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen bg-black text-white px-4">
            <p className="text-base sm:text-xl text-gray-400 text-center">Please sign in to view your quiz analytics.</p>
          </div>
        </SignedOut>
      </div>
    </>
  );
}