'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizUsage } from "@/hooks/useQuizUsage";
import { useCompanyUsage } from "@/hooks/useCompanyUsage";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Loader2, Calendar, BarChart3, RefreshCw, Zap, Clock, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { useState } from "react";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import Head from "next/head";

// Constants
const MONTHLY_QUIZ_LIMIT = 15;
const CANDIDATE_LIMIT = 500;

// Format date helper
const formatDate = (date: any) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Loading Skeleton Component
const LoadingCard = () => (
  <Card className="bg-black/30 backdrop-blur-lg border border-white/10 overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    <CardHeader className="space-y-2 pb-3 border-b border-white/10">
      <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
    </CardHeader>
    <CardContent className="space-y-3 p-6">
      <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
      <div className="h-2 w-full bg-white/10 rounded animate-pulse" />
    </CardContent>
  </Card>
);

const UsagePage = () => {
  const { data: usageData, isLoading: isQuizUsageLoading, error: quizUsageError, refetch: refetchQuizUsage } = useQuizUsage();
  const { data: companyUsageData, isLoading: isCompanyUsageLoading, error: companyUsageError, refetch: refetchCompanyUsage } = useCompanyUsage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const currentMonth = usageData?.current_month;
  const monthlyBreakdown = usageData?.monthly_breakdown || [];
  const totalQuizzes = usageData?.total_quizzes || 0;
  
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
  
  // Calculate usage percentage for progress bar
  const currentUsage = currentMonth?.quiz_count || 0;
  const usagePercentage = Math.min((currentUsage / MONTHLY_QUIZ_LIMIT) * 100, 100);
  const remainingQuizzes = Math.max(MONTHLY_QUIZ_LIMIT - currentUsage, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSideBar />
        <div className="flex-1 overflow-y-auto">
          <DashboardHeader />
          <div className="p-6 space-y-6">
            {/* Loading State with Gradient Spinner */}
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
                <div className="w-16 h-16 border-4 border-transparent rounded-full border-t-green-400 border-r-blue-400 animate-spin absolute top-0 left-0" />
              </div>
              <p className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-semibold">
                Loading your usage data ...
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

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSideBar />
        <div className="flex-1 overflow-y-auto">
          <DashboardHeader />
          <div className="p-6">
            <Card className="bg-black/30 backdrop-blur-lg border border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-red-400 text-xl">⚠</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Error loading usage data</p>
                    <p className="text-sm text-gray-400">{error.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">
                <span className="bg-white bg-clip-text text-transparent">
                  Usage
                </span>
              </h1>
              <p className="text-gray-300 text-sm">Track your quiz generation usage</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Updated: {formatDate(lastUpdated)}</span>
              </div>
              <Button 
                onClick={handleRefresh} 
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
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

          {/* Usage Overview Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Candidates Card */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-purple-500/20 shadow-xl rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {companyUsageData?.current_month?.unique_candidates || 0}
                    </div>
                    <p className="text-xs text-purple-300">unique</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Total Candidates</h3>
                  <p className="text-sm text-gray-400">This month's unique candidates</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 w-full bg-purple-500/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((companyUsageData?.current_month?.unique_candidates || 0) / CANDIDATE_LIMIT) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-purple-300 font-medium">
                      {Math.round(Math.min(((companyUsageData?.current_month?.unique_candidates || 0) / CANDIDATE_LIMIT) * 100, 100))}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Quizzes Card */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border border-blue-500/20 shadow-xl rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {currentMonth?.quiz_count || 0}
                    </div>
                    <p className="text-xs text-blue-300">created</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Total Quizzes</h3>
                  <p className="text-sm text-gray-400">This month's quiz creations</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 w-full bg-blue-500/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((currentMonth?.quiz_count || 0) / MONTHLY_QUIZ_LIMIT) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-blue-300 font-medium">
                      {Math.round(Math.min(((currentMonth?.quiz_count || 0) / MONTHLY_QUIZ_LIMIT) * 100, 100))}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Attempts Card */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg border border-green-500/20 shadow-xl rounded-2xl overflow-hidden hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {companyUsageData?.current_month?.total_attempts || 0}
                    </div>
                    <p className="text-xs text-green-300">attempts</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Total Attempts</h3>
                  <p className="text-sm text-gray-400">This month's quiz attempts</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-2 w-full bg-green-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-500 animate-pulse" />
                    </div>
                    <span className="text-xs text-green-300 font-medium">active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Usage Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Candidates Usage Bar Chart */}
            <UsageBarChart 
              current={companyUsageData?.current_month?.unique_candidates || 0}
              limit={CANDIDATE_LIMIT}
              title="Candidates This Month"
            />
            
            {/* Quiz Usage Bar Chart */}
            <UsageBarChart 
              current={currentMonth?.quiz_count || 0}
              limit={MONTHLY_QUIZ_LIMIT}
              title="Quizzes This Month"
            />
          </div>

          {/* Growth Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Growth Rate Card */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-lg border border-orange-500/20 shadow-xl rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="pb-3 border-b border-orange-500/20">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-orange-400" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">vs Previous Month</p>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const current = companyUsageData?.current_month?.unique_candidates || 0;
                          const previous = companyUsageData?.previous_month?.unique_candidates || 0;
                          const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
                          const isPositive = growth > 0;
                          
                          return (
                            <>
                              <span className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{growth.toFixed(1)}%
                              </span>
                              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? 'increase' : 'decrease'}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {companyUsageData?.current_month?.unique_candidates || 0}
                      </div>
                      <div className="text-xs text-gray-400">Current</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {companyUsageData?.previous_month?.unique_candidates || 0}
                      </div>
                      <div className="text-xs text-gray-400">Previous</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Efficiency Card */}
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-lg border border-indigo-500/20 shadow-xl rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="pb-3 border-b border-indigo-500/20">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                  Usage Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Avg. Attempts per Candidate</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-indigo-400">
                          {companyUsageData?.current_month?.unique_candidates > 0 
                            ? ((companyUsageData?.current_month?.total_attempts || 0) / companyUsageData?.current_month?.unique_candidates).toFixed(1)
                            : '0.0'
                          }
                        </span>
                        <span className="text-sm text-gray-400">attempts</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center shadow-lg">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {companyUsageData?.current_month?.total_attempts || 0}
                      </div>
                      <div className="text-xs text-gray-400">Total Attempts</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-white">
                        {companyUsageData?.current_month?.unique_candidates || 0}
                      </div>
                      <div className="text-xs text-gray-400">Candidates</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
    </DashboardAccess>
  );
};

// Interactive Bar Chart Component
const UsageBarChart = ({ current, limit, title }: { current: number; limit: number; title: string }) => {
  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80 && percentage != 100;
  const isAtLimit = percentage >= 100;
  
  return (
    <Card className="bg-black/30 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300">
      <CardHeader className="pb-3 border-b border-white/10">
        <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-5xl font-bold text-white mb-2">
                {current}
              </div>
              <p className="text-sm text-gray-400">
                of {limit} used
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-green-400'}`}>
                {limit - current}
              </div>
              <p className="text-xs text-gray-400">remaining</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Usage</span>
              <span className="font-medium text-white">{Math.round(percentage)}%</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit ? 'bg-gradient-to-r from-red-500 to-pink-500' : 
                  isNearLimit ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 
                  'bg-gradient-to-r from-green-400 to-blue-500'
                }`} 
                style={{ width: `${percentage}%` }}
              />
            </div>
            {isNearLimit && (
              <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-lg mt-3">
                <span>⚠️</span>
                <span>You're approaching your limit</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsagePage;