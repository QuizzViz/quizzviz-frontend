'use client';

import { Card, CardContent } from "@/components/ui/card";
import { useQuizUsage } from "@/hooks/useQuizUsage";
import { useCompanyUsage } from "@/hooks/useCompanyUsage";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Loader2, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { useState } from "react";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import Head from "next/head";

// Constants
const MONTHLY_QUIZ_LIMIT = 15;
const CANDIDATE_LIMIT = 500;

// Format time helper
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format reset date — first day of next month
const getResetDate = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  current: number;
  limit: number;
  color: 'purple' | 'teal';
}

const MetricCard = ({ label, current, limit, color }: MetricCardProps) => {
  const pct = Math.min((current / limit) * 100, 100);
  const remaining = Math.max(limit - current, 0);
  const isWarn = pct > 66 && pct < 90;
  const isDanger = pct >= 90;

  const barBase =
    color === 'purple'
      ? 'from-purple-500 to-pink-500'
      : 'from-blue-400 to-cyan-400';

  const barWarn = 'from-yellow-500 to-amber-500';
  const barDanger = 'from-red-500 to-rose-500';

  const barClass = isDanger ? barDanger : isWarn ? barWarn : barBase;

  const remainColor = isDanger
    ? 'text-red-400'
    : isWarn
    ? 'text-yellow-400'
    : color === 'purple'
    ? 'text-purple-400'
    : 'text-cyan-400';

  const accentBorder =
    color === 'purple'
      ? 'border-purple-500/20 hover:border-purple-500/40'
      : 'border-blue-500/20 hover:border-blue-500/40';

  const trackBg =
    color === 'purple' ? 'bg-purple-500/15' : 'bg-blue-500/15';

  return (
    <Card
      className={`bg-black/30 backdrop-blur-lg border ${accentBorder} rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]`}
    >
      <CardContent className="p-6 space-y-5">
        {/* Label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>

        {/* Numbers */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white leading-none">
              {current}
            </span>
            <span className="text-lg text-gray-500">/ {limit}</span>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${remainColor}`}>
              {remaining}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">remaining</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className={`h-2 w-full ${trackBg} rounded-full overflow-hidden`}>
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{Math.round(pct)}% used this month</p>
        </div>

        {/* Warning banner */}
        {(isWarn || isDanger) && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              isDanger
                ? 'bg-red-500/10 text-red-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}
          >
            <span>{isDanger ? '🔴' : '⚠️'}</span>
            <span>
              {isDanger
                ? `You've reached your ${label.toLowerCase()} limit`
                : `Only ${remaining} ${label.toLowerCase()} remaining`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const LoadingCard = () => (
  <Card className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
    <CardContent className="p-6 space-y-5">
      <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
      <div className="h-12 w-36 bg-white/15 rounded animate-pulse" />
      <div className="h-2 w-full bg-white/10 rounded-full animate-pulse" />
    </CardContent>
  </Card>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const UsagePage = () => {
  const {
    data: usageData,
    isLoading: isQuizUsageLoading,
    error: quizUsageError,
    refetch: refetchQuizUsage,
  } = useQuizUsage();
  const {
    data: companyUsageData,
    isLoading: isCompanyUsageLoading,
    error: companyUsageError,
    refetch: refetchCompanyUsage,
  } = useCompanyUsage();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const currentMonth = usageData?.current_month;
  const isLoading = isQuizUsageLoading || isCompanyUsageLoading;
  const error = quizUsageError || companyUsageError;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([refetchQuizUsage(), refetchCompanyUsage()]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const candidateCount = companyUsageData?.current_month?.unique_candidates ?? 0;
  const quizCount = currentMonth?.quiz_count ?? 0;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSideBar />
        <div className="flex-1 overflow-y-auto">
          <DashboardHeader />
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-green-400 border-r-blue-400 rounded-full animate-spin" />
              </div>
              <p className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-semibold text-sm">
                Loading usage data...
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <LoadingCard />
              <LoadingCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSideBar />
        <div className="flex-1 overflow-y-auto">
          <DashboardHeader />
          <div className="p-6">
            <Card className="bg-black/30 backdrop-blur-lg border border-red-500/20 rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-lg">
                    ⚠
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Error loading usage data</p>
                    <p className="text-xs text-gray-400 mt-0.5">{error.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ──
  return (
    <DashboardAccess>
      <Head>
        <title>Usage | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex min-h-screen bg-background">
        <DashboardSideBar />

        <div className="flex-1 overflow-y-auto">
          <DashboardHeader />

          <div className="p-6 max-w-3xl space-y-8">

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Usage</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Your plan consumption for{' '}
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md text-sm px-4 py-2 rounded-xl"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            {/* ── Two metric cards ── */}
            <div className="grid gap-5 sm:grid-cols-2">
              <MetricCard
                label="Candidates"
                current={candidateCount}
                limit={CANDIDATE_LIMIT}
                color="purple"
              />
              <MetricCard
                label="Quizzes"
                current={quizCount}
                limit={MONTHLY_QUIZ_LIMIT}
                color="teal"
              />
            </div>

            {/* ── Footer strip ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>
                  Updated at{' '}
                  <span className="text-white font-medium">{formatTime(lastUpdated)}</span>
                </span>
              </div>

              <div className="h-px sm:h-5 w-full sm:w-px bg-white/10" />

              <div className="text-sm text-gray-400">
                Resets on{' '}
                <span className="text-white font-medium">{getResetDate()}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardAccess>
  );
};

export default UsagePage;