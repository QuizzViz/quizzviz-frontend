"use client";

import { useEffect, useState, useMemo } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import { format, subDays } from "date-fns";
import { saveAs } from "file-saver";
import { Download, Sparkles } from "lucide-react";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US');

const exportCSV = (data: QuizResult[]) => {
  const headers = ['Username','Email','Score','Total Questions','Quiz Topic','Attempt','Date Attempted'];
  const csvContent = [
    headers.join(','),
    ...data.map(q => [
      `"${q.username}"`,
      `"${q.user_email}"`,
      q.result.score,
      q.result.total_questions,
      `"${q.result.quiz_topic}"`,
      q.attempt,
      `"${formatDate(q.created_at)}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `quiz-results-${new Date().toISOString().split('T')[0]}.csv`);
};

export default function ResultsDashboard() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<QuizResult[]>([]);
  const [selectedScores, setSelectedScores] = useState<{[quiz:string]: number|null}>({}); // Track selected score filter per quiz

  // Fetch quiz data
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchResults = async () => {
      try {
        const ownerId = user.firstName?.toLowerCase().replace(/\s+/g, '') || '';
        const res = await fetch(`/api/quiz_result?owner_id=${ownerId}`);
        const data = await res.json();
        setQuizData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [isLoaded, user]);

  // Group data by quiz topic
  const analyticsPerQuiz = useMemo(() => {
    const map = new Map<string, {scores: number[], details: QuizResult[]}>();
    quizData.forEach(q => {
      const topic = q.result.quiz_topic;
      if (!map.has(topic)) map.set(topic, {scores: [], details: []});
      map.get(topic)!.scores.push(q.result.score);
      map.get(topic)!.details.push(q);
    });

    const result: {quiz_topic:string, scoreDistribution:any[], details:QuizResult[]}[] = [];
    map.forEach((value, key) => {
      // Create bins for 0-10%, 10-20%, ..., 90-100%
      const bins: {[key:string]: QuizResult[]} = {};
      for(let i=0;i<=90;i+=10){ bins[`${i}-${i+10}%`] = []; }
      value.details.forEach(c => {
        const bucket = `${Math.floor(c.result.score/10)*10}-${Math.floor(c.result.score/10)*10+10}%`;
        bins[bucket].push(c);
      });
      const distribution = Object.entries(bins).map(([name, candidates])=>({name, count: candidates.length, candidates}));
      result.push({quiz_topic: key, scoreDistribution: distribution, details: value.details});
    });

    return result;
  }, [quizData]);

  if (loading || !isLoaded) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
        <p className="mt-4 text-gray-400">Loading analytics...</p>
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Quiz Analytics | Enterprise</title></Head>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-zinc-950 border-r border-zinc-800"><DashboardSideBar /></div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <DashboardHeader userName={user?.fullName || "User"} userEmail={user?.emailAddresses?.[0]?.emailAddress}/>
              <main className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">Quiz Analytics</h1>
                  <p className="text-gray-400 mb-4">Enterprise dashboard to identify top candidates</p>

                  {analyticsPerQuiz.map((quiz, idx)=> {
                    const selectedScore = selectedScores[quiz.quiz_topic] ?? null;
                    const filteredCandidates = selectedScore === null 
                      ? quiz.details 
                      : quiz.scoreDistribution.find(d=>d.name.startsWith(`${selectedScore}`))?.candidates || [];

                    return (
                      <Card key={idx} className="bg-zinc-950 border-zinc-800">
                        <CardHeader className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-white text-xl">{quiz.quiz_topic}</CardTitle>
                            <CardDescription className="text-gray-400">Click on a bar to filter candidates by score</CardDescription>
                          </div>
                          <Button onClick={()=>exportCSV(filteredCandidates)} className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
                            <Download className="h-4 w-4 mr-2"/> Export CSV
                          </Button>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Graph */}
                          <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={quiz.scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
                                <XAxis dataKey="name" stroke="#71717a"/>
                                <YAxis stroke="#71717a"/>
                                <Tooltip content={({payload}) => {
                                  if (!payload || !payload.length) return null;
                                  const candidates = payload[0].payload.candidates;
                                  return (
                                    <div className="bg-zinc-900 text-white p-2 rounded border border-zinc-700 max-w-xs">
                                      <p className="font-bold">{payload[0].name}</p>
                                      <p>Total Candidates: {payload[0].value}</p>
                                      {candidates.slice(0,5).map((c:QuizResult)=> <p key={c.quiz_id}>{c.username} ({c.result.score}%)</p>)}
                                      {candidates.length > 5 && <p>+{candidates.length-5} more...</p>}
                                    </div>
                                  );
                                }}/>
                                <Bar 
                                  dataKey="count" 
                                  fill="#8B5CF6" 
                                  onClick={(data)=>setSelectedScores({...selectedScores, [quiz.quiz_topic]: Number(data.name.split('-')[0])})}>
                                  {quiz.scoreDistribution.map((entry, index)=><Cell key={index} fill={COLORS[index%COLORS.length]}/>)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Table */}
                          <div className="max-h-96 overflow-y-auto w-full">
                            <Table className="min-w-full">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Username</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Score</TableHead>
                                  <TableHead>Attempt</TableHead>
                                  <TableHead>Date Attempted</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCandidates.length > 0 ? filteredCandidates.map((c:QuizResult)=>(
                                  <TableRow key={c.quiz_id}>
                                    <TableCell>{c.username}</TableCell>
                                    <TableCell>{c.user_email}</TableCell>
                                    <TableCell>{c.result.score}%</TableCell>
                                    <TableCell>{c.attempt}</TableCell>
                                    <TableCell>{formatDate(c.created_at)}</TableCell>
                                  </TableRow>
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-400 py-4">No candidates found</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
