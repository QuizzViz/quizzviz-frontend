"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import Head from "next/head";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
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
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { canPerformAction, getActionAllowedRoles } from "@/utils/rolePermissions";
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
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import Link from "next/link";

type QuizResult = {
  id?: number;
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
  quiz_experience?: string;
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
  quiz_experience?: string;
  details: QuizResult[];
  scoreDistribution: ScoreBin[];
  created_at: string; // earliest attempt for sorting
  max_attempts?: number;
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

type ScoreBandKey = "all" | "90-100" | "70-89" | "50-69" | "below-50";
type AttemptFilterKey = "all" | "1" | "2" | "3+";
type ScoreRange = { min: number; max: number } | null;

interface QuizFilterState {
  search: string;
  scoreRange: ScoreRange;
  attempt: AttemptFilterKey;
}

const DEFAULT_FILTER: QuizFilterState = { search: "", scoreRange: null, attempt: "all" };

const SCORE_BANDS: {
  key: ScoreBandKey;
  label: string;
  min: number;
  max: number;
  activeClass: string;
}[] = [
  { key: "all", label: "All Scores", min: 0, max: 100, activeClass: "bg-zinc-700 text-white border-zinc-600" },
  { key: "90-100", label: "90–100%", min: 90, max: 100, activeClass: "bg-green-600 text-white border-green-500" },
  { key: "70-89", label: "70–89%", min: 70, max: 89, activeClass: "bg-cyan-600 text-white border-cyan-500" },
  { key: "50-69", label: "50–69%", min: 50, max: 69, activeClass: "bg-yellow-500 text-black border-yellow-400" },
  { key: "below-50", label: "Below 50%", min: 0, max: 49.999, activeClass: "bg-red-600 text-white border-red-500" },
];

const rangesEqual = (a: ScoreRange, b: ScoreRange) => {
  if (a === null && b === null) return true;
  if (!a || !b) return false;
  return a.min === b.min && a.max === b.max;
};

const matchesScoreRange = (score: number, range: ScoreRange) => {
  if (!range) return true;
  return score >= range.min && score <= range.max;
};

// A range that doesn't exactly match one of the 4 quick-pick bands — e.g. one
// set by clicking a chart bar — gets its own "Score: X–Y%" chip since no pill
// would otherwise show as active for it.
const customRangeLabel = (range: ScoreRange) => {
  if (!range) return null;
  const isPreset = SCORE_BANDS.some((b) => b.key !== "all" && b.min === range.min && b.max === range.max);
  if (isPreset) return null;
  return `Score: ${range.min}–${Math.min(range.max, 100)}%`;
};

const matchesAttempt = (attempt: number, attemptKey: AttemptFilterKey) => {
  if (attemptKey === "all") return true;
  if (attemptKey === "3+") return attempt >= 3;
  return attempt === Number(attemptKey);
};

// Candidate Details table. The checkbox sits in its own gutter to the left,
// outside the data table's bordered card — but both the gutter and the card
// live inside ONE shared scroll container instead of two independently
// scrolling elements kept in sync by JS. A single shared scroll container
// means they move in lockstep by construction (there is nothing to
// desync); the previous two-scrollers-synced-by-scrollTop approach could
// never guarantee that. Both use the exact same TableRow/TableCell
// primitives so per-row heights match pixel-for-pixel between the gutter
// and the card.
function CandidateDetailsTable({
  candidates,
  selectedUsers,
  toggleUserSelection,
  companyId,
  hasActiveFilter,
}: {
  candidates: QuizResult[];
  selectedUsers: Record<string, boolean>;
  toggleUserSelection: (key: string) => void;
  companyId: string;
  hasActiveFilter: boolean;
}) {
  const rowKey = (c: QuizResult) => (c.id != null ? String(c.id) : `${c.quiz_id}|${c.user_email}|${c.attempt}`);
  const sorted = [...candidates].sort((a, b) => b.result.score - a.result.score);

  return (
    <div className="flex items-start gap-3 max-h-[420px] overflow-y-auto rounded-xl">
      {/* Checkbox gutter — outside the data table's own border/box */}
      {sorted.length > 0 && (
        <table className="shrink-0 text-sm border-separate border-spacing-0">
          <TableHeader className="sticky top-0 bg-zinc-950 z-10">
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="w-10 bg-transparent border-b-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => {
              const key = rowKey(c);
              return (
                <TableRow key={key} className="hover:bg-transparent border-b-0">
                  <TableCell className="bg-transparent">
                    <input
                      type="checkbox"
                      checked={!!selectedUsers[key]}
                      onChange={() => toggleUserSelection(key)}
                      className="rounded border-zinc-600 text-purple-500 focus:ring-purple-500 bg-zinc-800 cursor-pointer"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      )}

      {/* Data table — Username/Email/Score/Attempt/Date only */}
      <div className="flex-1 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm border-separate border-spacing-0">
          <TableHeader className="sticky top-0 bg-zinc-900 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead>Username</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Attempt</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  {hasActiveFilter ? "No candidates match your filters" : "No results yet for this quiz"}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((c) => {
                const key = rowKey(c);
                return (
                  <TableRow key={key} className="hover:bg-zinc-900/60 cursor-pointer relative">
                    <Link
                      href={`/${companyId}/analytics/candidate/${encodeURIComponent(c.user_email)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-20"
                      aria-label={`View ${c.username}'s analytics`}
                    />
                    <TableCell className="font-medium relative z-10">{c.username}</TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-xs relative z-10">{c.user_email}</TableCell>
                    <TableCell className="relative z-10">
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
                    <TableCell className="relative z-10">{c.attempt}</TableCell>
                    <TableCell className="hidden sm:table-cell relative z-10">{formatDate(c.created_at)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}

// Helper component for disabled buttons with permission tooltip
const DisabledButtonWithTooltip = ({ 
  children, 
  permission, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  permission: string; 
  allowedRoles: string; 
}) => (
  <TooltipProvider>
    <ShadTooltip>
      <TooltipTrigger asChild>
        <Button disabled className="opacity-50 cursor-not-allowed">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">
          This action requires {allowedRoles} permissions.
        </p>
      </TooltipContent>
    </ShadTooltip>
  </TooltipProvider>
);

export default function ResultsDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [filters, setFilters] = useState<Record<string, QuizFilterState>>({});
  const getFilter = useCallback((quizId: string) => filters[quizId] ?? DEFAULT_FILTER, [filters]);
  const updateFilter = useCallback((quizId: string, patch: Partial<QuizFilterState>) => {
    setFilters((prev) => ({ ...prev, [quizId]: { ...(prev[quizId] ?? DEFAULT_FILTER), ...patch } }));
  }, []);
  const clearFilter = useCallback((quizId: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
  }, []);
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

  // Use the same logic as profile page
  const { companyInfo, isLoading: isCompanyLoading, error: companyError } = useCompanyInfo();
  const finalCompanyId = companyInfo?.id || '';
  const { userRole, loading: roleLoading } = useUserRole(finalCompanyId);
  
  // Check if we have cached role data available immediately
  const hasCachedRole = useRef(false);
  useEffect(() => {
    if (userRole && !roleLoading) {
      hasCachedRole.current = true;
    }
  }, [userRole, roleLoading]);

  // Use effective role for permission checks
  const effectiveRole = userRole || (hasCachedRole.current ? { 
    id: 'cached', user_id: '', company_id: '', role: 'OWNER' as const, 
    status: 'ACTIVE' as const, created_at: '', updated_at: '' 
  } : null);
  const router = useRouter();

  // Fetch quiz results
  const { data: quizResults, isLoading, refetch: refetchResults } = useCachedFetch<QuizResult[] | { results: QuizResult[] } | { error: string }>(
    ['quizResults', finalCompanyId as string],
    finalCompanyId ? `/api/quiz_result?company_id=${finalCompanyId}` : '',
    { enabled: Boolean(finalCompanyId) }
  );

  // max_attempts lives in the publish service, not the results/attempts data
  // above — fetch it once for the whole company and look it up by quiz_id.
  const { data: publishedQuizzesData } = useCachedFetch<{ success: boolean; quizzes: { quiz_id: string; max_attempts?: number }[] }>(
    ['publishedQuizzes', finalCompanyId as string],
    finalCompanyId ? `/api/publish/company/${encodeURIComponent(finalCompanyId)}` : '',
    { enabled: Boolean(finalCompanyId) }
  );
  const maxAttemptsByQuizId = useMemo(() => {
    const map = new Map<string, number>();
    (publishedQuizzesData?.quizzes || []).forEach((p) => {
      if (p.max_attempts != null) map.set(p.quiz_id, p.max_attempts);
    });
    return map;
  }, [publishedQuizzesData]);

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
    if (user && finalCompanyId && !dataFetched.current) {
      dataFetched.current = true;
    }
  }, [user, finalCompanyId]);

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

        const sorted = [...details].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          quiz_id,
          role,
          details: sorted,
          scoreDistribution: getScoreBins(sorted),
          created_at: sorted[0]?.created_at || new Date().toISOString(),
          max_attempts: maxAttemptsByQuizId.get(quiz_id),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [quizData, maxAttemptsByQuizId]);

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
      
      // Get auth token using Clerk's getToken method
      const token = await getToken();
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      const res = await fetch(`/api/quiz_result/delete?quiz_id=${quizId}&company_id=${finalCompanyId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Delete failed");
      }
      await refetchResults();
      toast({ title: "Success", description: "Quiz data deleted", className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
 });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteQuizModal({ show: false, quizId: "", role: "" });
    }
  };

  const handleDeleteSelectedUsers = async () => {
    if (!showDeleteUsersModal.quizId) return;

    // Selection is now keyed per-attempt (row id), so each selected key deletes exactly
    // that one attempt — other attempts by the same candidate are left untouched.
    const selectedKeys = Object.entries(selectedUsers)
      .filter(([, v]) => v)
      .map(([k]) => k);

    try {
      setIsDeleting(true);

      // Get auth token using Clerk's getToken method
      const token = await getToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const promises = selectedKeys.map((key) => {
        const attemptId = Number(key);
        const url = Number.isFinite(attemptId)
          ? `/api/quiz_result/delete?attempt_id=${attemptId}&company_id=${finalCompanyId}`
          : `/api/quiz_result/delete?quiz_id=${showDeleteUsersModal.quizId}&email=${encodeURIComponent(key.split("|")[1] || "")}&company_id=${finalCompanyId}`;
        return fetch(url, { method: "DELETE", headers });
      });

      const responses = await Promise.all(promises);
      const failed = responses.filter((r) => !r.ok);

      if (failed.length > 0) {
        const errors = await Promise.all(failed.map((r) => r.json()));
        throw new Error(errors.map((e) => e.message).join(", "));
      }

      await refetchResults();
      setSelectedUsers({});
      toast({ title: "Success", description: "Selected results deleted",     className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteUsersModal({ show: false, quizId: "" });
    }
  };

  if (isLoading || isCompanyLoading || roleLoading) {
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
        <title>Analytics | QuizzViz</title>
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
                        const filter = getFilter(quiz.quiz_id);
                        const filteredCandidates = quiz.details.filter((c) => {
                          const q = filter.search.trim().toLowerCase();
                          const matchesSearch =
                            !q ||
                            c.username.toLowerCase().includes(q) ||
                            c.user_email.toLowerCase().includes(q);
                          return (
                            matchesSearch &&
                            matchesScoreRange(c.result.score, filter.scoreRange) &&
                            matchesAttempt(c.attempt, filter.attempt)
                          );
                        });
                        const hasActiveFilter =
                          filter.search.trim() !== "" || filter.scoreRange !== null || filter.attempt !== "all";

                        const highestScore = Math.max(...quiz.details.map((d) => d.result.score), 0);
                        const topScorer = quiz.details.find((d) => d.result.score === highestScore);
                        const correctCount = topScorer
                          ? Math.round((highestScore / 100) * (topScorer.result.total_questions ?? 0))
                          : 0;
                        const totalQ = topScorer?.result.total_questions ?? 0;

                        const totalAttempts = quiz.details.length;
                        const uniqueCandidates = new Set(quiz.details.map((d) => d.user_email)).size;
                        const maxAttempt = Math.max(...quiz.details.map((d) => d.attempt), 1);

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
                                  {quiz.max_attempts != null && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 border border-amber-500/20">
                                      Max attempts allowed: {quiz.max_attempts}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {effectiveRole && canPerformAction(effectiveRole, 'delete_analytics_all') ? (
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
                              ) : (
                                <DisabledButtonWithTooltip
                                  permission="delete_analytics_all"
                                  allowedRoles={getActionAllowedRoles('delete_analytics_all')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Quiz Data
                                </DisabledButtonWithTooltip>
                              )}
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
                                        const end = start === 0 ? 10 : start + 9;
                                        const clickedRange = { min: start, max: end };
                                        updateFilter(quiz.quiz_id, {
                                          scoreRange: rangesEqual(filter.scoreRange, clickedRange) ? null : clickedRange,
                                        });
                                      }}
                                    >
                                      {quiz.scoreDistribution.map((entry, i) => {
                                        const start = Number(entry.name.split("-")[0]);
                                        const end = start === 0 ? 10 : start + 9;
                                        const inActiveRange =
                                          !!filter.scoreRange && start <= filter.scoreRange.max && end >= filter.scoreRange.min;
                                        const hasData = entry.count > 0;

                                        return (
                                          <Cell
                                            key={`cell-${i}`}
                                            fill={hasData ? (inActiveRange ? "#10B981" : "#8B5CF6") : "#27272a"}
                                            style={{ cursor: hasData ? "pointer" : "default", transition: "all 0.2s ease" }}
                                          />
                                        );
                                      })}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>

                              <div className="space-y-4">
                                {/* Search + filter bar */}
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3"
                                >
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input
                                      value={filter.search}
                                      onChange={(e) => updateFilter(quiz.quiz_id, { search: e.target.value })}
                                      placeholder="Search by name or email..."
                                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    />
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1 mr-1">
                                      <SlidersHorizontal className="h-3 w-3" /> Score
                                    </span>
                                    {SCORE_BANDS.map((band) => {
                                      const bandRange: ScoreRange = band.key === "all" ? null : { min: band.min, max: band.max };
                                      const isActive = rangesEqual(filter.scoreRange, bandRange);
                                      return (
                                        <button
                                          key={band.key}
                                          onClick={() =>
                                            updateFilter(quiz.quiz_id, { scoreRange: isActive ? null : bandRange })
                                          }
                                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                                            isActive
                                              ? `${band.activeClass} scale-105 shadow-md`
                                              : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
                                          }`}
                                        >
                                          {band.label}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {maxAttempt > 1 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs text-zinc-500 mr-1">Attempt</span>
                                      {(
                                        [
                                          { key: "all" as const, label: "All" },
                                          { key: "1" as const, label: "1st" },
                                          { key: "2" as const, label: "2nd" },
                                          ...(maxAttempt > 2 ? [{ key: "3+" as const, label: "3rd+" }] : []),
                                        ]
                                      ).map((opt) => (
                                        <button
                                          key={opt.key}
                                          onClick={() =>
                                            updateFilter(quiz.quiz_id, {
                                              attempt: filter.attempt === opt.key ? "all" : opt.key,
                                            })
                                          }
                                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                                            filter.attempt === opt.key
                                              ? "bg-purple-600 text-white border-purple-500 scale-105 shadow-md"
                                              : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  <AnimatePresence>
                                    {hasActiveFilter && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center justify-between pt-3 border-t border-zinc-800/60 overflow-hidden flex-wrap gap-2"
                                      >
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs text-purple-300">
                                            Showing {filteredCandidates.length} of {quiz.details.length} candidates
                                          </span>
                                          {customRangeLabel(filter.scoreRange) && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs">
                                              {customRangeLabel(filter.scoreRange)}
                                              <button onClick={() => updateFilter(quiz.quiz_id, { scoreRange: null })} className="hover:text-white">
                                                <X className="h-3 w-3" />
                                              </button>
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => clearFilter(quiz.quiz_id)}
                                          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                                        >
                                          <X className="h-3 w-3" /> Clear filters
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>

                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                  <h2 className="text-xl font-semibold border-l-4 border-purple-500 pl-3">
                                    Candidate Details
                                    {hasActiveFilter && (
                                      <span className="ml-2 text-sm text-purple-400">(Filtered)</span>
                                    )}
                                  </h2>

                                  <div className="flex flex-wrap gap-3">
                                    {hasSelectedUsers && (
                                      effectiveRole && canPerformAction(effectiveRole, 'delete_analytics_specific') ? (
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
                                      ) : (
                                        <DisabledButtonWithTooltip
                                          permission="delete_analytics_specific"
                                          allowedRoles={getActionAllowedRoles('delete_analytics_specific')}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Delete ({Object.values(selectedUsers).filter(Boolean).length})
                                        </DisabledButtonWithTooltip>
                                      )
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

                                <CandidateDetailsTable
                                  candidates={filteredCandidates}
                                  selectedUsers={selectedUsers}
                                  toggleUserSelection={toggleUserSelection}
                                  companyId={finalCompanyId}
                                  hasActiveFilter={hasActiveFilter}
                                />
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