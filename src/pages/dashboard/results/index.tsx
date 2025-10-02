// "use client";

// import { useEffect, useState, useMemo } from "react";
// import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
// import Head from "next/head";
// import { saveAs } from "file-saver";
// import { Download, Sparkles, RefreshCcw } from "lucide-react";

// import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
// import { DashboardHeader } from "@/components/Dashboard/Header";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Cell,
// } from "recharts";

// type QuizResult = {
//   quiz_id: string;
//   owner_id: string;
//   username: string;
//   user_email: string;
//   result: {
//     score: number;
//     quiz_topic: string;
//     total_questions: number;
//   };
//   attempt: number;
//   created_at: string;
// };

// const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

// const formatDate = (dateString: string) =>
//   new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });

// const exportCSV = (data: QuizResult[]) => {
//   const headers = ['Username','Email','Score','Total Questions','Quiz Topic','Attempt','Date Attempted'];
//   const csvContent = [
//     headers.join(','),
//     ...data.map(q => [
//       `"${q.username}"`,
//       `"${q.user_email}"`,
//       q.result.score,
//       q.result.total_questions,
//       `"${q.result.quiz_topic}"`,
//       q.attempt,
//       `"${formatDate(q.created_at)}"`
//     ].join(','))
//   ].join('\n');

//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//   saveAs(blob, `quiz-results-${new Date().toISOString().split('T')[0]}.csv`);
// };

// export default function ResultsDashboard() {
//   const { user, isLoaded } = useUser();
//   const [loading, setLoading] = useState(true);
//   const [quizData, setQuizData] = useState<QuizResult[]>([]);
//   const [selectedScores, setSelectedScores] = useState<{[quiz:string]: number|null}>({});

//   useEffect(() => {
//     if (!isLoaded || !user) return;

//     const fetchResults = async () => {
//       try {
//         const ownerId = user.firstName?.toLowerCase().replace(/\s+/g, '') || '';
//         const res = await fetch(`/api/quiz_result?owner_id=${ownerId}`);
//         const data = await res.json();
//         setQuizData(data);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchResults();
//   }, [isLoaded, user]);

//   // Group and bin data by quiz topic with 5% increments (0-100%)
//   const analyticsPerQuiz = useMemo(() => {
//     const map = new Map<string, {scores: number[], details: QuizResult[] }>();
//     quizData.forEach(q => {
//       const topic = q.result.quiz_topic;
//       if (!map.has(topic)) map.set(topic, {scores: [], details: []});
//       map.get(topic)!.scores.push(q.result.score);
//       map.get(topic)!.details.push(q);
//     });

//     const result: {quiz_topic:string, scoreDistribution:any[], details:QuizResult[]}[] = [];
//     map.forEach((value, key) => {
//       const bins: {[key:string]: QuizResult[]} = {};
//       for(let i=0;i<100;i+=5){ bins[`${i}-${i+5}%`] = []; }
//       value.details.forEach(c => {
//         const bucketStart = Math.min(Math.floor(c.result.score / 5) * 5, 95);
//         const bucket = `${bucketStart}-${bucketStart+5}%`;
//         bins[bucket].push(c);
//       });
//       const distribution = Object.entries(bins).map(([name, candidates])=>({name, count: candidates.length, candidates}));
//       result.push({quiz_topic: key, scoreDistribution: distribution, details: value.details});
//     });

//     return result;
//   }, [quizData]);

//   if (loading || !isLoaded) return (
//     <div className="flex items-center justify-center h-screen bg-black">
//       <div className="text-center">
//         <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto relative">
//           <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
//         </div>
//         <p className="mt-4 text-gray-400">Loading analytics...</p>
//       </div>
//     </div>
//   );

//   return (
//     <>
//       <Head><title>Quiz Analytics | Enterprise</title></Head>
//       <div className="min-h-screen bg-black text-white">
//         <SignedIn>
//           <div className="flex min-h-screen">
//             <div className="bg-zinc-950 border-r border-zinc-800"><DashboardSideBar /></div>
//             <div className="flex-1 flex flex-col overflow-hidden">
//               <DashboardHeader userName={user?.fullName || "User"} userEmail={user?.emailAddresses?.[0]?.emailAddress}/>
//               <main className="flex-1 overflow-y-auto bg-black">
//                 <div className="max-w-7xl mx-auto p-6 space-y-6">
//                   <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">Quiz Analytics</h1>
//                   <p className="text-gray-400 mb-4">Enterprise dashboard to identify top candidates</p>

//                   {analyticsPerQuiz.map((quiz, idx)=> {
//                     const selectedScore = selectedScores[quiz.quiz_topic] ?? null;
//                     const filteredCandidates = selectedScore === null 
//                       ? quiz.details 
//                       : quiz.scoreDistribution.find(d=>d.name.startsWith(`${selectedScore}`))?.candidates || [];

//                     const maxCount = Math.max(...quiz.scoreDistribution.map(d=>d.count), 1);
//                     const highestScore = Math.max(...quiz.details.map(d=>d.result.score), 0);
//                     const topCandidates = quiz.details.filter(d=>d.result.score === highestScore);

//                     return (
//                       <Card key={idx} className="bg-zinc-950 border-zinc-800 shadow-lg rounded-xl">
//                         <CardHeader className="flex justify-between items-center">
//                           <div>
//                             <CardTitle className="text-white text-xl">{quiz.quiz_topic}</CardTitle>
//                             <CardDescription className="text-gray-400">Click on a bar to filter candidates by score</CardDescription>
//                           </div>
//                         </CardHeader>

//                         <CardContent className="space-y-6">
//                           {/* Graph and Key Stats */}
//                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                             <div className="h-96 w-full">
//                               <ResponsiveContainer width="120%" height="100%">
//                                 <BarChart data={quiz.scoreDistribution}>
//                                   <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
//                                   <XAxis dataKey="name" stroke="#71717a" interval={0} angle={-45} textAnchor="end"/>
//                                   <YAxis stroke="#71717a" allowDecimals={false} domain={[0, maxCount]}/>
//                                   <Tooltip content={({payload}) => {
//                                     if (!payload || !payload.length) return null;
//                                     const candidates = payload[0].payload.candidates;
//                                     return (
//                                       <div className="bg-zinc-900 text-white p-3 rounded border border-zinc-700 max-w-xs shadow-lg">
//                                         <p className="font-bold">{payload[0].name}</p>
//                                         <p>Total Candidates: {payload[0].value}</p>
//                                         {candidates.slice(0,5).map((c:QuizResult)=> <p key={c.quiz_id}>{c.username} ({c.result.score}%)</p>)}
//                                         {candidates.length > 5 && <p>+{candidates.length-5} more...</p>}
//                                       </div>
//                                     );
//                                   }}/>
//                                   <Bar 
//                                     dataKey="count" 
//                                     onClick={(data)=>setSelectedScores({...selectedScores, [quiz.quiz_topic]: Number(data.name.split('-')[0])})}>
//                                     {quiz.scoreDistribution.map((entry, index)=><Cell key={index} fill={COLORS[index%COLORS.length]}/>)}
//                                   </Bar>
//                                 </BarChart>
//                               </ResponsiveContainer>
//                               {/* Key Stats */}
//                               <div className="mt-4 flex flex-wrap gap-4 text-gray-300">
//                                 <div className="flex flex-col">
//                                   <span className="text-sm">Total Attempts</span>
//                                   <span className="font-bold text-white">{quiz.details.reduce((sum, d)=>sum+d.attempt, 0)}</span>
//                                 </div>
//                                 <div className="flex flex-col">
//                                   <span className="text-sm">Total Candidates</span>
//                                   <span className="font-bold text-white">{quiz.details.length}</span>
//                                 </div>
//                                 <div className="flex flex-col">
//                                   <span className="text-sm">Highest Score</span>
//                                   <span className="font-bold text-white">{highestScore}%</span>
//                                   <span className="text-xs text-gray-400">Top: {topCandidates.map(t=>t.user_email).join(', ')}</span>
//                                 </div>
//                               </div>
//                               {/* Reset filter button */}
//                               {selectedScore !== null && (
//                                 <Button onClick={()=>setSelectedScores({...selectedScores, [quiz.quiz_topic]: null})} variant="ghost" size="sm" className="mt-2 flex items-center gap-2">
//                                   <RefreshCcw className="w-4 h-4"/> Reset Filter
//                                 </Button>
//                               )}
//                             </div>
//                           </div>

//                           {/* Table */}
//                           <div className="overflow-x-auto">
//                             <div className="flex justify-between items-center mb-2">
//                               <h2 className="text-lg font-semibold text-white">Candidate Details</h2>
//                               <Button onClick={()=>exportCSV(filteredCandidates)} className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 hover:scale-105 transition-transform flex items-center gap-2">
//                                 <Download className="h-4 w-4"/> Export CSV
//                               </Button>
//                             </div>
//                             <div className="max-h-96 overflow-y-auto border border-zinc-800 rounded-xl">
//                               <Table className="min-w-full">
//                                 <TableHeader className="sticky top-0 bg-zinc-950 z-10">
//                                   <TableRow>
//                                     <TableHead>Username</TableHead>
//                                     <TableHead>Email</TableHead>
//                                     <TableHead>Score</TableHead>
//                                     <TableHead>Attempt</TableHead>
//                                     <TableHead>Date Attempted</TableHead>
//                                   </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                   {filteredCandidates.length > 0 ? filteredCandidates.map((c:QuizResult, index:number)=>(
//                                     <TableRow key={c.quiz_id} className={index % 2 === 0 ? "bg-zinc-900 hover:bg-zinc-800" : "bg-zinc-800 hover:bg-zinc-700"}>
//                                       <TableCell>{c.username}</TableCell>
//                                       <TableCell>{c.user_email}</TableCell>
//                                       <TableCell>
//                                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                                           c.result.score >= 80 ? "bg-green-600 text-white" :
//                                           c.result.score >= 50 ? "bg-yellow-500 text-black" :
//                                           "bg-red-500 text-white"
//                                         }`}>{c.result.score}%</span>
//                                       </TableCell>
//                                       <TableCell>{c.attempt}</TableCell>
//                                       <TableCell>{formatDate(c.created_at)}</TableCell>
//                                     </TableRow>
//                                   )) : (
//                                     <TableRow>
//                                       <TableCell colSpan={5} className="text-center text-gray-400 py-4">No candidates found</TableCell>
//                                     </TableRow>
//                                   )}
//                                 </TableBody>
//                               </Table>
//                             </div>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     )
//                   })}
//                 </div>
//               </main>
//             </div>
//           </div>
//         </SignedIn>

//         <SignedOut>
//           <div className="flex items-center justify-center h-screen bg-black text-white">
//             <p>Please sign in to view your quiz analytics.</p>
//           </div>
//         </SignedOut>
//       </div>
//     </>
//   );
// }


"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Head from "next/head";
import { saveAs } from "file-saver";
import { Download, Sparkles, RefreshCcw, Users, Trophy, Mail } from "lucide-react";

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

// --- QUIZ DATA TYPES AND UTILITIES ---

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

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });

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


// --- MAIN COMPONENT ---

export default function ResultsDashboard() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<QuizResult[]>([]);
  const [selectedScores, setSelectedScores] = useState<{[quiz:string]: number|null}>({});
  
  // FIX: Use a ref to ensure the API call only runs once on component load/auth ready.
  const dataFetched = useRef(false);

  // API simulation to replace static data
  const fetchResults = useCallback(async (currentUser: typeof user) => {
    // Only set loading if data hasn't been fetched yet
    if (!dataFetched.current) {
        setLoading(true);
    }
    
    try {
      // Use the user passed as an argument for stability
      const ownerId = currentUser?.firstName?.toLowerCase().replace(/\s+/g, ''); 
      
      const res = await fetch(`/api/quiz_result?owner_id=${ownerId}`);
      const data = await res.json();
      setQuizData(data); 
      console.log("Data successfully loaded from API endpoint.");

    } catch (err) {
      console.error("Failed to fetch data from API:", err);
    } finally {
      setLoading(false);
    }
  // The function doesn't need to be recreated if user changes, 
  // as the user data is passed as an argument from the useEffect dependency.
  }, []); 

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
      // Use the candidate's highest score per topic for distribution count
      const uniqueCandidates = Array.from(new Map(value.details.map(item => [item['user_email'], item])).values());
      
      const bins: {[key:string]: QuizResult[]} = {};
      // Define 5% bins (0-5, 5-10, ..., 95-100)
      for(let i=0;i<100;i+=5){ bins[`${i}-${i+5}%`] = []; }
      
      uniqueCandidates.forEach(c => {
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

  if (loading || !isLoaded) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto relative">
          <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
        </div>
        <p className="mt-4 text-gray-400">Fetching data from API...</p>
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Quiz Analytics | Enterprise</title></Head>
      <div className="min-h-screen bg-black text-white font-sans">
        <SignedIn>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="bg-zinc-950 border-r border-zinc-800"><DashboardSideBar /></div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <DashboardHeader userName={user?.fullName || "User"} userEmail={user?.emailAddresses?.[0]?.emailAddress}/>
              
              <main className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-7xl mx-auto p-6 space-y-8"> {/* Adjusted space-y */}
                  <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                    Enterprise Quiz Analytics
                  </h1>
                  <p className="text-lg text-gray-400 mb-6">
                    Analyze candidate performance and identify top talent across quiz topics.
                  </p>

                  {analyticsPerQuiz.map((quiz, idx)=> {
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
                    const topCandidates = quiz.details
                        .filter(d=>d.result.score === highestScore)
                        .map(d=>d.user_email)
                        .filter((value, index, self) => self.indexOf(value) === index); // Unique emails

                    const totalAttempts = quiz.details.length; // Corrected to just count entries, not sum attempt number
                    const totalUniqueCandidates = Array.from(new Set(quiz.details.map(d=>d.user_email))).length;
                    const maxCount = Math.max(...quiz.scoreDistribution.map(d=>d.count), 1);


                    return (
                      <Card key={idx} className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-xl p-4 transition-all duration-500 hover:shadow-purple-500/10">
                        <CardHeader className="flex flex-row justify-between items-start border-b border-zinc-800 pb-3 mb-4">
                          <div>
                            <CardTitle className="text-white text-3xl font-semibold">{quiz.quiz_topic} Performance</CardTitle>
                            <CardDescription className="text-gray-400 mt-1">Score distribution for unique candidates. Click on a bar to filter results.</CardDescription>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          
                          {/* ELEGANT TEXT KPI DISPLAY (Replaces Cards) */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 pt-2 pb-4 border-b border-zinc-900">
                              <div className="flex items-center space-x-2">
                                  <Users className="w-5 h-5 text-indigo-400"/>
                                  <p className="text-gray-300 text-sm">
                                      <span className="font-bold text-white text-lg">{totalAttempts}</span> Total Attempts 
                                      <span className="text-xs text-gray-500"> ({totalUniqueCandidates} unique candidates)</span>
                                  </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Trophy className="w-5 h-5 text-yellow-400"/>
                                  <p className="text-gray-300 text-sm">
                                      <span className="font-bold text-white text-lg">{highestScore.toFixed(2)}%</span> Highest Score
                                  </p>
                              </div>
                              <div className="flex items-center space-x-2 col-span-1 sm:col-span-1">
                                  <Mail className="w-5 h-5 text-pink-400"/>
                                  <p className="text-gray-300 text-sm truncate max-w-full">
                                      <span className="font-bold text-white text-lg">Top Candidate:</span> 
                                      <span className="ml-1 text-xs">{topCandidates.slice(0, 1).join(', ')}{topCandidates.length > 1 ? ` (+${topCandidates.length - 1})` : ''}</span>
                                  </p>
                              </div>
                          </div>


                          {/* CHART SECTION */}
                          <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={quiz.scoreDistribution} margin={{ top: 10, right: 30, left: 20, bottom: 90 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
                                <XAxis 
                                  dataKey="name" 
                                  stroke="#71717a" 
                                  interval={0} 
                                  angle={-45} 
                                  textAnchor="end"
                                  height={90}
                                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                                />
                                {/* YAxis domain is set dynamically based on maxCount */}
                                <YAxis stroke="#71717a" allowDecimals={false} domain={[0, maxCount]}/> 
                                <Tooltip content={({payload}) => {
                                  if (!payload || !payload.length) return null;
                                  const candidates = payload[0].payload.candidates;
                                  return (
                                    <div className="bg-zinc-800/90 backdrop-blur-sm text-white p-4 rounded-xl border border-zinc-700 max-w-xs shadow-2xl">
                                      <p className="font-bold text-lg text-purple-300">{payload[0].name}</p>
                                      <p className="text-sm mt-1">Candidates in Range: <span className="font-semibold">{payload[0].value}</span></p>
                                      {candidates.slice(0,3).map((c:QuizResult)=> <p key={c.quiz_id} className="text-xs text-gray-300 mt-0.5 truncate">{c.username} ({c.result.score.toFixed(2)}%)</p>)}
                                      {candidates.length > 3 && <p className="text-xs text-purple-400 mt-1">+{candidates.length-3} more candidates...</p>}
                                    </div>
                                  );
                                }}/>
                                <Bar 
                                  dataKey="count" 
                                  radius={[8, 8, 0, 0]}
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
                            {/* Reset filter button - positioned below the chart */}
                            {selectedScore !== null && (
                              <div className="mt-4 flex justify-center lg:justify-start">
                                  <Button onClick={()=>setSelectedScores({...selectedScores, [quiz.quiz_topic]: null})} 
                                      className="flex items-center gap-2 text-purple-400 hover:bg-zinc-800 bg-transparent hover:text-white text-sm"
                                  >
                                      <RefreshCcw className="w-4 h-4"/> Reset Filter ({selectedScore}-{selectedScore+5}% Band)
                                  </Button>
                              </div>
                            )}
                          </div>

                          {/* TABLE SECTION (Moved up, less space) */}
                          <div className="space-y-4 pt-6 border-t border-zinc-900">
                            <div className="flex justify-between items-center mb-2">
                              <h2 className="text-2xl font-semibold text-white border-l-4 border-purple-500 pl-3">
                                Candidate Details {selectedScore !== null && <span className="text-base font-normal text-purple-400"> (Filtered Results)</span>}
                              </h2>
                              <Button 
                                onClick={()=>exportCSV(filteredCandidates)} 
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
                              >
                                <Download className="h-4 w-4"/> Export CSV ({filteredCandidates.length})
                              </Button>
                            </div>
                            {/* Scrollable Table Container */}
                            <div className="max-h-[300px] overflow-y-auto border border-zinc-800 rounded-xl"> 
                              <Table>
                                <TableHeader className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-700">
                                  <TableRow className="hover:bg-zinc-900">
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Attempt</TableHead>
                                    <TableHead>Date Attempted</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredCandidates.length > 0 ? (
                                    // Sorting by score descending for the table
                                    filteredCandidates.sort((a, b) => b.result.score - a.result.score).map((c:QuizResult, index:number)=>(
                                    <TableRow key={c.quiz_id} className="bg-zinc-950 border-zinc-800 text-gray-300 hover:bg-zinc-800/80 transition-colors duration-200">
                                      <TableCell className="font-medium">{c.username}</TableCell>
                                      <TableCell className="text-sm">{c.user_email}</TableCell>
                                      <TableCell>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                                          c.result.score >= 90 ? "bg-green-600 text-white" :
                                          c.result.score >= 70 ? "bg-cyan-600 text-white" :
                                          c.result.score >= 50 ? "bg-yellow-500 text-black" :
                                          "bg-red-500 text-white"
                                        }`}>{c.result.score.toFixed(2)}%</span>
                                      </TableCell>
                                      <TableCell>{c.attempt}</TableCell>
                                      <TableCell>{formatDate(c.created_at)}</TableCell>
                                    </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-gray-500 py-8 text-lg">
                                        {selectedScore !== null 
                                          ? `No attempts found for the selected score range in this topic.`
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
                    )
                  })}
                </div>
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen bg-black text-white">
            <p className="text-xl text-gray-400">Please sign in to view your quiz analytics.</p>
          </div>
        </SignedOut>
      </div>
    </>
  );
}