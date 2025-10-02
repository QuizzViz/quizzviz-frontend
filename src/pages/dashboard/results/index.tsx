"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import { format, subDays } from "date-fns";
import { Download, TrendingUp, TrendingDown, Target, Clock, Trophy, Activity, ChevronDown, Sparkles } from "lucide-react";
import { saveAs } from 'file-saver';

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  LineChart,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";

// Types
type QuizResult = {
  quiz_id: string;
  owner_id: string;
  username: string;
  user_email: string;
  user_answers: Array<{
    is_correct: boolean;
    question_id: string;
    user_answer: string;
    correct_answer: string;
  }>;
  result: {
    score: number;
    quiz_topic: string;
    time_taken: number;
    correct_answers: number;
    quiz_difficulty: string;
    total_questions: number;
  };
  attempt: number;
  created_at: string;
};

type QuizSummary = {
  quiz_topic: string;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  latest_attempt: string;
};

type QuizAnalytics = {
  quiz_topic: string;
  attempts: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  avgTime: number;
  scoreData: Array<{ date: string; score: number }>;
  difficultyBreakdown: Array<{ difficulty: string; count: number }>;
};

// Utility functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const exportToCSV = (data: QuizResult[]) => {
  const headers = [
    'Username',
    'Email',
    'Quiz Topic',
    'Score',
    'Correct Answers',
    'Total Questions',
    'Time Taken',
    'Difficulty',
    'Attempt',
    'Date Attempted'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(quiz => [
      `"${quiz.username}"`,
      `"${quiz.user_email}"`,
      `"${quiz.result.quiz_topic}"`,
      quiz.result.score,
      quiz.result.correct_answers,
      quiz.result.total_questions,
      formatTime(quiz.result.time_taken),
      `"${quiz.result.quiz_difficulty}"`,
      quiz.attempt,
      `"${formatDate(quiz.created_at)}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `quiz-results-${new Date().toISOString().split('T')[0]}.csv`);
};

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

export default function ResultsDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [quizData, setQuizData] = useState<QuizResult[]>([]);
  const [filteredData, setFilteredData] = useState<QuizResult[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'created_at', 
    direction: 'desc' 
  });

  // Fetch quiz results
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchQuizResults = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const ownerId = user.firstName?.toLowerCase().replace(/\s+/g, '') || '';
        const response = await fetch(`/api/quiz_result?owner_id=${ownerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quiz results');
        }
        
        const data = await response.json();
        setQuizData(data);
        setFilteredData(data);
      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError('Failed to load quiz results. Please try again later.');
      } finally {
        setIsFetching(false);
        setIsLoading(false);
      }
    };

    fetchQuizResults();
  }, [isLoaded, user]);

  // Apply filters
  useEffect(() => {
    if (!quizData.length) return;

    let result = [...quizData];

    if (dateRange.from || dateRange.to) {
      result = result.filter(quiz => {
        const quizDate = new Date(quiz.created_at);
        return (
          (!dateRange.from || quizDate >= dateRange.from) &&
          (!dateRange.to || quizDate <= new Date(dateRange.to.setHours(23, 59, 59, 999)))
        );
      });
    }

    if (selectedQuiz && selectedQuiz !== 'all') {
      result = result.filter(quiz => quiz.result.quiz_topic === selectedQuiz);
    }

    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortConfig.key === 'score') {
        comparison = a.result.score - b.result.score;
      } else if (sortConfig.key === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortConfig.key === 'time_taken') {
        comparison = a.result.time_taken - b.result.time_taken;
      } else if (sortConfig.key === 'username') {
        comparison = a.username.localeCompare(b.username);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    setFilteredData(result);
  }, [quizData, dateRange, selectedQuiz, sortConfig]);

  // Get unique quiz topics
  const quizTopics = useMemo(() => {
    const topics = new Set<string>();
    quizData.forEach(quiz => topics.add(quiz.result.quiz_topic));
    return Array.from(topics);
  }, [quizData]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (!filteredData.length) return null;

    const totalAttempts = filteredData.length;
    const avgScore = filteredData.reduce((sum, q) => sum + q.result.score, 0) / totalAttempts;
    const avgTime = filteredData.reduce((sum, q) => sum + q.result.time_taken, 0) / totalAttempts;
    const highestScore = Math.max(...filteredData.map(q => q.result.score));
    const recentImprovement = filteredData.length >= 5 
      ? ((filteredData.slice(0, 5).reduce((sum, q) => sum + q.result.score, 0) / 5) -
         (filteredData.slice(-5).reduce((sum, q) => sum + q.result.score, 0) / 5))
      : 0;

    return {
      totalAttempts,
      avgScore,
      avgTime,
      highestScore,
      recentImprovement
    };
  }, [filteredData]);

  // Quiz-specific analytics
  const quizAnalytics = useMemo(() => {
    if (!quizData.length) return [];

    const analyticsMap = new Map<string, QuizAnalytics>();

    quizData.forEach(quiz => {
      const topic = quiz.result.quiz_topic;
      
      if (!analyticsMap.has(topic)) {
        analyticsMap.set(topic, {
          quiz_topic: topic,
          attempts: 0,
          avgScore: 0,
          highestScore: 0,
          lowestScore: 100,
          avgTime: 0,
          scoreData: [],
          difficultyBreakdown: []
        });
      }

      const analytics = analyticsMap.get(topic)!;
      analytics.attempts += 1;
      analytics.avgScore = ((analytics.avgScore * (analytics.attempts - 1)) + quiz.result.score) / analytics.attempts;
      analytics.avgTime = ((analytics.avgTime * (analytics.attempts - 1)) + quiz.result.time_taken) / analytics.attempts;
      analytics.highestScore = Math.max(analytics.highestScore, quiz.result.score);
      analytics.lowestScore = Math.min(analytics.lowestScore, quiz.result.score);
      
      analytics.scoreData.push({
        date: format(new Date(quiz.created_at), 'MMM d'),
        score: quiz.result.score
      });
    });

    return Array.from(analyticsMap.values());
  }, [quizData]);

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];

    filteredData.forEach(quiz => {
      const score = quiz.result.score;
      const range = ranges.find(r => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [filteredData]);

  // Performance over time
  const performanceOverTime = useMemo(() => {
    const dateMap = new Map<string, { totalScore: number; count: number }>();
    
    filteredData.forEach(quiz => {
      const date = format(new Date(quiz.created_at), 'MMM d');
      if (!dateMap.has(date)) {
        dateMap.set(date, { totalScore: 0, count: 0 });
      }
      const data = dateMap.get(date)!;
      data.totalScore += quiz.result.score;
      data.count += 1;
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        avgScore: Math.round(data.totalScore / data.count),
        attempts: data.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData]);

  // Difficulty distribution
  const difficultyDistribution = useMemo(() => {
    const dist = { Easy: 0, Medium: 0, Hard: 0 };
    filteredData.forEach(quiz => {
      const diff = quiz.result.quiz_difficulty;
      if (diff in dist) dist[diff as keyof typeof dist]++;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Quiz Analytics | QuizzViz</title>
        <meta name="description" content="Advanced analytics and insights for your quiz performance." />
      </Head>
      
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="bg-zinc-950 border-r border-zinc-800">
              <DashboardSideBar />
            </div>
            
            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <DashboardHeader
                userName={user?.fullName || user?.firstName || "User"}
                userEmail={user?.emailAddresses?.[0]?.emailAddress}
              />
              
              <main className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                        Quiz Analytics
                      </h1>
                      <p className="text-gray-400 mt-2">Track your performance and progress over time</p>
                    </div>
                    <Button 
                      onClick={() => exportToCSV(filteredData)} 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Filters */}
                  <Card className="bg-zinc-950 border-zinc-800">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Quiz Topic
                          </label>
                          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                            <SelectTrigger className="bg-black border-zinc-700 text-white">
                              <SelectValue placeholder="All Quizzes" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              <SelectItem value="all">All Quizzes</SelectItem>
                              {quizTopics.map(topic => (
                                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Date Range
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full bg-black border-zinc-700 text-white hover:bg-zinc-900">
                                {dateRange.from ? (
                                  dateRange.to ? (
                                    <>
                                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                                    </>
                                  ) : (
                                    format(dateRange.from, 'MMM d, yyyy')
                                  )
                                ) : (
                                  <span>Pick a date range</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                              <CalendarComp
                                mode="range"
                                selected={{ from: dateRange.from, to: dateRange.to }}
                                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                numberOfMonths={2}
                                className="bg-zinc-900 text-white"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="flex items-end">
                          <Button
                            onClick={() => {
                              setSelectedQuiz('all');
                              setDateRange({ from: undefined, to: undefined });
                            }}
                            variant="outline"
                            className="w-full bg-black border-zinc-700 text-white hover:bg-zinc-900"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overall Stats */}
                  {overallStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-purple-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-400">Total Attempts</p>
                              <h3 className="text-3xl font-bold text-white mt-1">{overallStats.totalAttempts}</h3>
                            </div>
                            <div className="bg-purple-500/20 p-3 rounded-xl">
                              <Activity className="h-6 w-6 text-purple-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-pink-600/20 to-pink-900/20 border-pink-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent"></div>
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-400">Average Score</p>
                              <h3 className="text-3xl font-bold text-white mt-1">{overallStats.avgScore.toFixed(1)}%</h3>
                            </div>
                            <div className="bg-pink-500/20 p-3 rounded-xl">
                              <Target className="h-6 w-6 text-pink-400" />
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm">
                            {overallStats.recentImprovement > 0 ? (
                              <><TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                              <span className="text-green-400">+{overallStats.recentImprovement.toFixed(1)}%</span></>
                            ) : (
                              <><TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                              <span className="text-red-400">{overallStats.recentImprovement.toFixed(1)}%</span></>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border-yellow-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent"></div>
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-400">Highest Score</p>
                              <h3 className="text-3xl font-bold text-white mt-1">{overallStats.highestScore}%</h3>
                            </div>
                            <div className="bg-yellow-500/20 p-3 rounded-xl">
                              <Trophy className="h-6 w-6 text-yellow-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-blue-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-400">Avg. Time</p>
                              <h3 className="text-3xl font-bold text-white mt-1">{formatTime(overallStats.avgTime)}</h3>
                            </div>
                            <div className="bg-blue-500/20 p-3 rounded-xl">
                              <Clock className="h-6 w-6 text-blue-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Over Time */}
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-white">Performance Trend</CardTitle>
                        <CardDescription className="text-gray-400">Your score progression over time</CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performanceOverTime}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="date" stroke="#71717a" />
                            <YAxis stroke="#71717a" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#18181b',
                                border: '1px solid #3f3f46',
                                borderRadius: '0.5rem',
                                color: '#fff'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="avgScore" 
                              stroke="#8B5CF6" 
                              fillOpacity={1} 
                              fill="url(#colorScore)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Score Distribution */}
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-white">Score Distribution</CardTitle>
                        <CardDescription className="text-gray-400">How your scores are distributed</CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="range" stroke="#71717a" />
                            <YAxis stroke="#71717a" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#18181b',
                                border: '1px solid #3f3f46',
                                borderRadius: '0.5rem',
                                color: '#fff'
                              }}
                            />
                            <Bar dataKey="count" fill="#EC4899" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Difficulty Distribution */}
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-white">Difficulty Breakdown</CardTitle>
                        <CardDescription className="text-gray-400">Quiz attempts by difficulty level</CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={difficultyDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {difficultyDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#18181b',
                                border: '1px solid #3f3f46',
                                borderRadius: '0.5rem',
                                color: '#fff'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quiz-Specific Analytics */}
                  {quizAnalytics.map((analytics, idx) => (
                    <Card key={idx} className="bg-zinc-950 border-zinc-800">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white text-xl">{analytics.quiz_topic}</CardTitle>
                            <CardDescription className="text-gray-400">Detailed performance analytics</CardDescription>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-gray-400">Attempts</p>
                              <p className="text-xl font-bold text-purple-400">{analytics.attempts}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400">Avg Score</p>
                              <p className="text-xl font-bold text-pink-400">{analytics.avgScore.toFixed(1)}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400">Best</p>
                              <p className="text-xl font-bold text-green-400">{analytics.highestScore}%</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.scoreData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="date" stroke="#71717a" />
                            <YAxis stroke="#71717a" domain={[0, 100]} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#18181b',
                                border: '1px solid #3f3f46',
                                borderRadius: '0.5rem',
                                color: '#fff'
                              }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Results Table */}
                  <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-white">Detailed Results</CardTitle>
                      <CardDescription className="text-gray-400">All quiz attempts in a tabular format</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('username')}>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('score')}>Score</TableHead>
                            <TableHead>Correct / Total</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('time_taken')}>Time Taken</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>Date Attempted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.length > 0 ? (
                            filteredData.map((quiz) => (
                              <TableRow key={quiz.quiz_id}>
                                <TableCell>{quiz.username}</TableCell>
                                <TableCell>{quiz.user_email}</TableCell>
                                <TableCell>{quiz.result.score}%</TableCell>
                                <TableCell>{quiz.result.correct_answers} / {quiz.result.total_questions}</TableCell>
                                <TableCell>{formatTime(quiz.result.time_taken)}</TableCell>
                                <TableCell>
                                  <Badge className={`${
                                    quiz.result.quiz_difficulty === 'Easy' ? 'bg-green-600' :
                                    quiz.result.quiz_difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}>{quiz.result.quiz_difficulty}</Badge>
                                </TableCell>
                                <TableCell>{formatDate(quiz.created_at)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-gray-400 py-4">
                                No quiz results found for the selected filters.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen bg-black text-white">
            <p>Please sign in to view your quiz analytics.</p>
          </div>
        </SignedOut>
      </div>
    </>
  );
}
