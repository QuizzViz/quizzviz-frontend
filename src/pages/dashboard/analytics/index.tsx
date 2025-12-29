"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import Head from "next/head";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download,
  RefreshCcw,
  Users,
  Trophy,
  CheckCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";
import { toast } from "@/hooks/use-toast";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";

type QuizResult = {
  quiz_id: string;
  owner_id: string;
  username: string;
  user_email: string;
  result: {
    score: number;
    role?: string;
    total_questions: number;
    [key: string]: any;
  };
  attempt: number;
  role?: string;
  created_at: string;
  quiz_difficulty?: string;
  total_questions?: number;
};

type ScoreBin = {
  name: string;
  count: number;
  candidates: QuizResult[];
};

type QuizAnalytics = {
  quiz_id: string;
  role: string;
  quiz_difficulty?: string;
  details: QuizResult[];
  scoreDistribution: ScoreBin[];
  created_at: string; // earliest attempt for sorting
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const prepareExportData = (data: QuizResult[]) =>
  data.map((q) => ({
    Username: q.username,
    Email: q.user_email,
    Score: q.result.score,
    "Total Questions": q.result.total_questions ?? q.total_questions ?? 0,
    Role: q.result.role || q.role || "—",
    Attempt: q.attempt,
    "Date Attempted": formatDate(q.created_at),
  }));

const exportExcel = (data: QuizResult[]) => {
  if (!data.length) return;
  const prepared = prepareExportData(data);
  const ws = XLSX.utils.json_to_sheet(prepared);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  XLSX.writeFile(wb, `quiz-results-${new Date().toISOString().split("T")[0]}.xlsx`);
};

const exportPDF = (data: QuizResult[]) => {
  if (!data.length) return;

  const prepared = prepareExportData(data);
  const quizRole = data[0]?.result?.role || data[0]?.role || "Quiz";
  const totalQuestions = data[0]?.result?.total_questions ?? data[0]?.total_questions ?? 0;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text(`${quizRole} Quiz Results`, 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Total Questions: ${totalQuestions}`, 14, 30);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 40,
    head: [["Username", "Email", "Score", "Attempt", "Date Attempted"]],
    body: prepared.map((row) => [
      row.Username,
      row.Email,
      row.Score,
      row.Attempt,
      row["Date Attempted"],
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 3,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      cellWidth: "wrap",
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 40 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.height;
      doc.text(
        `Page ${data.pageNumber} of ${doc.lastAutoTable?.pageCount || 1}`,
        pageWidth - 30,
        pageHeight - 10
      );
    },
  });

  doc.save(`${quizRole.toLowerCase().replace(/\s+/g, "-")}-results-${new Date().toISOString().split("T")[0]}.pdf`);
};

const getScoreBins = (results: QuizResult[]): ScoreBin[] => {
  // Create bins for 0-10, 11-20, ..., 91-100
  const distribution: ScoreBin[] = Array(10).fill(0).map((_, i) => ({
    name: i === 0 ? '0-10' : `${i}1-${i+1}0`,
    count: 0,
    candidates: [],
  }));

  results.forEach((r) => {
    const score = r.result.score;
    // For scores 0-100, calculate the correct bin index
    // 0-10 -> bin 0, 11-20 -> bin 1, ..., 100 -> bin 9
    let binIndex = Math.min(Math.floor(score / 10.1), 9);
    binIndex = Math.min(Math.max(0, binIndex), 9); // Ensure within bounds
    distribution[binIndex].count++;
    distribution[binIndex].candidates.push(r);
  });

  return distribution;
};

export default function ResultsDashboard() {
  const { user } = useUser();

  const [selectedScores, setSelectedScores] = useState<Record<string, number | null>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});
  const [showDeleteQuizModal, setShowDeleteQuizModal] = useState<{
    show: boolean;
    quizId: string;
    role: string;
  }>({ show: false, quizId: "", role: "" });
  const [showDeleteUsersModal, setShowDeleteUsersModal] = useState<{
    show: boolean;
    quizId: string;
  }>({ show: false, quizId: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const quizzesPerPage = 5;
  const dataFetched = useRef(false);


  // Fetch company info
  const { data: companyData, isLoading: isCompanyLoading } = useCachedFetch<{
    companies: Array<{ id?: string; company_id?: string }>;
  }>(
    ['companyInfo', user?.id as string],
    user ? `/api/company/check?owner_id=${user.id}` : '',
    { enabled: Boolean(user) }
  );

  const companyId = companyData?.companies?.[0]?.company_id || companyData?.companies?.[0]?.id;

  // Fetch quiz results
 const { data: quizResults, isLoading, refetch: refetchResults } = useCachedFetch<QuizResult[] | { results: QuizResult[] } | { error: string }>(
    ['quizResults', companyId as string],
    companyId ? `/api/quiz_result?company_id=${companyId}` : '',
    { 
      enabled: Boolean(companyId)
    }
  );


  useEffect(() => {
    if (quizResults) {
      setLastUpdated(new Date());
    }
  }, [quizResults]);
  
  // Process quiz results
  const quizData = useMemo(() => {
    if (!quizResults) return [];
    if (quizResults === null || (typeof quizResults === 'object' && 'error' in quizResults)) {
      return [];
    }
    return Array.isArray(quizResults) ? quizResults : (quizResults.results || []);
  }, [quizResults]);

   useEffect(() => {
  if (quizResults && 'error' in quizResults) {
    console.error('Error fetching quiz results:', quizResults.error);
    toast({
      title: "Error",
      description: "Failed to load quiz results",
      variant: "destructive",
    });
  } else if (quizResults) {
    setLastUpdated(new Date());
  }
}, [quizResults]);
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      setForceRefresh(true);
      await refetchResults();
      setLastUpdated(new Date());
    } finally {
      setForceRefresh(false);
    }
  }, [refetchResults]);

  // Set initial loaded state
  useEffect(() => {
    if (user && companyId && !dataFetched.current) {
      dataFetched.current = true;
    }
  }, [user, companyId]);

  // Handle errors
  useEffect(() => {
    if (quizResults === null || (typeof quizResults === 'object' && 'error' in quizResults)) {
      // Don't show error toast, just show empty state
      return;
    }
  }, [quizResults]);

  useEffect(() => {
    setSelectedUsers({});
  }, [quizData]);

  const analyticsPerQuiz = useMemo<QuizAnalytics[]>(() => {
    if (!quizData || !Array.isArray(quizData) || quizData.length === 0) return [];

    const map = new Map<string, QuizResult[]>();

    quizData.forEach((item) => {
      if (!map.has(item.quiz_id)) map.set(item.quiz_id, []);
      map.get(item.quiz_id)!.push(item);
    });

    return Array.from(map.entries())
      .map(([quiz_id, details]) => {
        const first = details[0];
        const role = first.result.role || first.role || "Quiz";
        const difficulty = first.quiz_difficulty;

        const sorted = [...details].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          quiz_id,
          role,
          quiz_difficulty: difficulty,
          details: sorted,
          scoreDistribution: getScoreBins(sorted),
          created_at: sorted[0]?.created_at || new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [quizData]);

  const totalPages = Math.ceil(analyticsPerQuiz.length / quizzesPerPage);

  const paginatedQuizzes = useMemo(
    () =>
      analyticsPerQuiz.slice(
        (currentPage - 1) * quizzesPerPage,
        currentPage * quizzesPerPage
      ),
    [analyticsPerQuiz, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [analyticsPerQuiz.length]);

  const toggleUserSelection = (key: string) => {
    setSelectedUsers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasSelectedUsers = useMemo(
    () => Object.values(selectedUsers).some(Boolean),
    [selectedUsers]
  );

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/quiz_result/delete?quiz_id=${quizId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Delete failed");
      }
      await refetchResults();
      toast({ title: "Success", description: "Quiz data deleted", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteQuizModal({ show: false, quizId: "", role: "" });
    }
  };

  const handleDeleteSelectedUsers = async () => {
    if (!showDeleteUsersModal.quizId) return;

    const toDelete = Object.entries(selectedUsers)
      .filter(([, v]) => v)
      .map(([k]) => {
        const [username, email] = k.split("|");
        return { username, email };
      });

    try {
      setIsDeleting(true);
      const promises = toDelete.map(({ email }) =>
        fetch(
          `/api/quiz_result/delete?quiz_id=${showDeleteUsersModal.quizId}&email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        )
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter((r) => !r.ok);

      if (failed.length > 0) {
        const errors = await Promise.all(failed.map((r) => r.json()));
        throw new Error(errors.map((e) => e.message).join(", "));
      }

      await refetchResults();
      setSelectedUsers({});
      toast({ title: "Success", description: "Selected results deleted", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteUsersModal({ show: false, quizId: "" });
    }
  };

  if (isLoading || isCompanyLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <DashboardAccess>
          <div className="flex min-h-screen bg-black">
            <div className="bg-zinc-950 border-r border-zinc-800 shrink-0">
              <DashboardSideBar />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <DashboardHeader />
              <main className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-7xl mx-auto p-4 md:p-6">
                  <LoadingSpinner text="Loading analytics..." />
                </div>
              </main>
            </div>
          </div>
        </DashboardAccess>
      </div>
    );
  }

  return (
    <DashboardAccess>
      <Head>
        <title>Quiz Analytics</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen flex-col lg:flex-row">
            <div className="bg-zinc-950 border-r border-zinc-800 shrink-0">
              <DashboardSideBar />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <DashboardHeader />

              <main className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Quiz Analytics</h1>
                    <div className="flex items-center gap-4">
                      {lastUpdated && (
                        <div className="text-sm text-gray-400">
                          Last updated: {new Date(lastUpdated).toLocaleString()}
                        </div>
                      )}
                      <Button 
                      onClick={handleRefresh} 
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {forceRefresh ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Refreshing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          <span>Refresh</span>
                        </>
                      )}
                    </Button>
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center py-24">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                    </div>
                  ) : analyticsPerQuiz.length === 0 ? (
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardContent className="py-16 flex flex-col items-center text-center">
                        <BarChart3 className="h-16 w-16 text-gray-600 mb-6" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-3">No Results Yet</h3>
                        <p className="text-gray-500 max-w-md">
                          Candidate quiz results will appear here once they complete your assessments.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {paginatedQuizzes.map((quiz) => {
                        const selectedStart = selectedScores[quiz.quiz_id] ?? null;
                        const selectedBin =
                          selectedStart !== null
                            ? quiz.scoreDistribution.find(
                                (d) => Number(d.name.split("-")[0]) === selectedStart
                              )
                            : null;

                        const filteredCandidates = selectedBin ? selectedBin.candidates : quiz.details;

                        const highestScore = Math.max(...quiz.details.map((d) => d.result.score), 0);
                        const topScorer = quiz.details.find((d) => d.result.score === highestScore);
                        const correctCount = topScorer
                          ? Math.round((highestScore / 100) * (topScorer.result.total_questions ?? 0))
                          : 0;
                        const totalQ = topScorer?.result.total_questions ?? 0;

                        const totalAttempts = quiz.details.length;
                        const uniqueCandidates = new Set(quiz.details.map((d) => d.username)).size;

                        return (
                          <Card
                            key={quiz.quiz_id}
                            className="bg-zinc-950 border-zinc-800 shadow-xl hover:shadow-purple-900/20 transition-shadow"
                          >
                            <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 border-b border-zinc-800 pb-4">
                              <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <CardTitle className="text-2xl md:text-3xl font-bold">
                                    {quiz.role} Quiz
                                  </CardTitle>
                                  {quiz.quiz_difficulty && (
                                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 text-white">
                                      {quiz.quiz_difficulty}
                                    </span>
                                  )}
                                </div>
                                <CardDescription className="mt-2 text-gray-400">
                                  Click bars to filter candidates by score range
                                </CardDescription>
                              </div>

                              <Button
                                variant="destructive"
                                onClick={() =>
                                  setShowDeleteQuizModal({
                                    show: true,
                                    quizId: quiz.quiz_id,
                                    role: quiz.role,
                                  })
                                }
                                className="gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Quiz Data
                              </Button>
                            </CardHeader>

                            <CardContent className="pt-6 space-y-8">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                  <Users className="h-5 w-5 text-indigo-400" />
                                  <div>
                                    <p className="text-2xl font-bold">{totalAttempts}</p>
                                    <p className="text-sm text-gray-400">
                                      Attempts ({uniqueCandidates} unique)
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Trophy className="h-5 w-5 text-yellow-400" />
                                  <div>
                                    <p className="text-2xl font-bold">{highestScore.toFixed(1)}%</p>
                                    <p className="text-sm text-gray-400">Highest Score</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                  <div>
                                    <p className="text-2xl font-bold">
                                      {correctCount}/{totalQ}
                                    </p>
                                    <p className="text-sm text-gray-400">Correct (top attempt)</p>
                                  </div>
                                </div>
                              </div>

                              <div className="h-96 md:h-[420px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={quiz.scoreDistribution}
                                    margin={{ top: 20, right: 10, bottom: 80, left: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis
                                      dataKey="name"
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                      stroke="#71717a"
                                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                                      interval={0}
                                    />
                                    <YAxis
                                      stroke="#71717a"
                                      allowDecimals={false}
                                      tick={{ fill: "#9ca3af" }}
                                    />
                                    <Tooltip
                                      cursor={{ fill: "rgba(139,92,246,0.1)" }}
                                      content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const item = payload[0].payload as ScoreBin;
                                        return (
                                          <div className="bg-zinc-900 border border-purple-500/40 rounded-lg p-4 shadow-xl min-w-[240px]">
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-700">
                                              <span className="font-bold text-purple-300">{item.name}%</span>
                                              <span className="px-2.5 py-1 bg-purple-600/80 rounded-full text-xs font-bold">
                                                {item.count}
                                              </span>
                                            </div>
                                            {item.candidates.length > 0 ? (
                                              <div className="space-y-2 max-h-48 overflow-auto">
                                                {item.candidates.slice(0, 5).map((c, i) => (
                                                  <div
                                                    key={i}
                                                    className="flex justify-between text-sm bg-zinc-800/60 p-2 rounded"
                                                  >
                                                    <span className="truncate max-w-[140px]">{c.username}</span>
                                                    <span className="font-bold text-purple-300">
                                                      {c.result.score.toFixed(1)}%
                                                    </span>
                                                  </div>
                                                ))}
                                                {item.candidates.length > 5 && (
                                                  <p className="text-xs text-center text-purple-400 pt-2">
                                                    +{item.candidates.length - 5} more
                                                  </p>
                                                )}
                                              </div>
                                            ) : (
                                              <p className="text-center text-gray-500 py-3 text-sm">
                                                No attempts in this range
                                              </p>
                                            )}
                                          </div>
                                        );
                                      }}
                                    />
                                    <Bar
                                      dataKey="count"
                                      radius={[6, 6, 0, 0]}
                                      maxBarSize={50}
                                      onClick={(data: any) => {
                                        if (!data?.count) return;
                                        const start = Number(data.name.split("-")[0]);
                                        setSelectedScores((prev) => ({
                                          ...prev,
                                          [quiz.quiz_id]: prev[quiz.quiz_id] === start ? null : start,
                                        }));
                                      }}
                                    >
                                      {quiz.scoreDistribution.map((entry, i) => {
                                        const start = Number(entry.name.split("-")[0]);
                                        const isSelected = selectedScores[quiz.quiz_id] === start;
                                        const hasData = entry.count > 0;

                                        return (
                                          <Cell
                                            key={`cell-${i}`}
                                            fill={hasData ? (isSelected ? "#10B981" : "#8B5CF6") : "#27272a"}
                                            style={{
                                              cursor: hasData ? "pointer" : "default",
                                              transition: "all 0.2s ease",
                                            }}
                                          />
                                        );
                                      })}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>

                                {selectedStart !== null && (
                                  <div className="mt-4 text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSelectedScores((prev) => ({ ...prev, [quiz.quiz_id]: null }))
                                      }
                                      className="gap-2 border-purple-500/50 text-purple-300 hover:text-purple-200"
                                    >
                                      <RefreshCcw className="h-4 w-4" />
                                      Clear {selectedStart}–{selectedStart + 9}% Filter
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                  <h2 className="text-xl font-semibold border-l-4 border-purple-500 pl-3">
                                    Candidate Details
                                    {selectedStart !== null && (
                                      <span className="ml-2 text-sm text-purple-400">(Filtered)</span>
                                    )}
                                  </h2>

                                  <div className="flex flex-wrap gap-3">
                                    {hasSelectedUsers && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          setShowDeleteUsersModal({
                                            show: true,
                                            quizId: quiz.quiz_id,
                                          })
                                        }
                                        className="gap-2"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete ({Object.values(selectedUsers).filter(Boolean).length})
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700 gap-2"
                                      onClick={() => exportExcel(filteredCandidates)}
                                    >
                                      <Download className="h-4 w-4" />
                                      Excel ({filteredCandidates.length})
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700 gap-2"
                                      onClick={() => exportPDF(filteredCandidates)}
                                    >
                                      <Download className="h-4 w-4" />
                                      PDF ({filteredCandidates.length})
                                    </Button>
                                  </div>
                                </div>

                                <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                                  <Table>
                                    <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                                      <TableRow>
                                        <TableHead className="w-10" />
                                        <TableHead>Username</TableHead>
                                        <TableHead className="hidden md:table-cell">Email</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Attempt</TableHead>
                                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {filteredCandidates.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                            {selectedStart !== null
                                              ? "No candidates in selected score range"
                                              : "No results yet for this quiz"}
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        filteredCandidates
                                          .sort((a, b) => b.result.score - a.result.score)
                                          .map((c) => {
                                            const key = `${c.username}|${c.user_email}`;
                                            return (
                                              <TableRow key={key} className="hover:bg-zinc-900/60">
                                                <TableCell>
                                                  <input
                                                    type="checkbox"
                                                    checked={!!selectedUsers[key]}
                                                    onChange={() => toggleUserSelection(key)}
                                                    className="rounded border-zinc-600 text-purple-500 focus:ring-purple-500 bg-zinc-800"
                                                  />
                                                </TableCell>
                                                <TableCell className="font-medium">{c.username}</TableCell>
                                                <TableCell className="hidden md:table-cell truncate max-w-xs">
                                                  {c.user_email}
                                                </TableCell>
                                                <TableCell>
                                                  <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                                      c.result.score >= 90
                                                        ? "bg-green-600 text-white"
                                                        : c.result.score >= 70
                                                        ? "bg-cyan-600 text-white"
                                                        : c.result.score >= 50
                                                        ? "bg-yellow-500 text-black"
                                                        : "bg-red-600 text-white"
                                                    }`}
                                                  >
                                                    {c.result.score.toFixed(1)}%
                                                  </span>
                                                </TableCell>
                                                <TableCell>{c.attempt}</TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                  {formatDate(c.created_at)}
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
                          <div className="text-sm text-gray-400">
                            Showing {(currentPage - 1) * quizzesPerPage + 1}–
                            {Math.min(currentPage * quizzesPerPage, analyticsPerQuiz.length)} of{" "}
                            {analyticsPerQuiz.length} quizzes
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                            </Button>

                            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                              const page = i + 1;
                              return (
                                <Button
                                  key={page}
                                  size="sm"
                                  variant={currentPage === page ? "default" : "outline"}
                                  className="min-w-[36px]"
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </Button>
                              );
                            })}

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                              Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <p className="text-xl text-gray-400 text-center">
              Please sign in to view your quiz analytics dashboard.
            </p>
          </div>
        </SignedOut>
      </div>

      {showDeleteQuizModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" /> Confirm Deletion
              </h3>
              <button
                onClick={() => setShowDeleteQuizModal({ show: false, quizId: "", role: "" })}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-8 text-center">
              All data for <span className="font-semibold text-white">{showDeleteQuizModal.role} Quiz</span> will be
              permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteQuizModal({ show: false, quizId: "", role: "" })}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteQuiz(showDeleteQuizModal.quizId)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Everything"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteUsersModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" /> Confirm Deletion
              </h3>
              <button
                onClick={() => setShowDeleteUsersModal({ show: false, quizId: "" })}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-8 text-center">
              Delete <span className="font-bold text-white">
                {Object.values(selectedUsers).filter(Boolean).length}
              </span> selected result
              {Object.values(selectedUsers).filter(Boolean).length !== 1 ? "s" : ""}?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteUsersModal({ show: false, quizId: "" })}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelectedUsers}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Selected"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardAccess>
  );
}