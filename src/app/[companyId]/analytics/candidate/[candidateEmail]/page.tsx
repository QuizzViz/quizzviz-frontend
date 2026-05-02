// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { useUser } from "@clerk/nextjs";
// import { QuizResultAPI } from "@/lib/quizResult";
// import { CandidateAnalytics } from "@/types/quizResult";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { LoadingSpinner } from "@/components/ui/loading";
// import { toast } from "@/hooks/use-toast";
// import { useCompanyInfo } from "@/hooks/useCompanyInfo";
// import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
// import { DashboardHeader } from "@/components/Dashboard/Header";
// import {
//   Download,
//   ArrowLeft,
//   User,
//   Mail,
//   Trophy,
//   Target,
//   TrendingUp,
//   FileText,
//   Award,
//   BarChart3,
//   Loader2,
//   Sparkles,
//   CheckCircle2,
//   XCircle,
// } from "lucide-react";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// export default function CandidateDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useUser();
//   const { companyInfo } = useCompanyInfo();

//   const [candidateAnalytics, setCandidateAnalytics] = useState<CandidateAnalytics | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);

//   const candidateEmail = params.candidateEmail as string;
//   const companyId = params.companyId as string;

//   useEffect(() => {
//     if (candidateEmail) {
//       fetchCandidateAnalytics();
//     }
//   }, [candidateEmail]);

//   const fetchCandidateAnalytics = async () => {
//     try {
//       setLoading(true);
//       const analytics = await QuizResultAPI.getCandidateAnalytics(candidateEmail);
//       setCandidateAnalytics(analytics);
//     } catch (error) {
//       console.error("Error fetching candidate analytics:", error);
//       toast({
//         title: "Error",
//         description: error instanceof Error ? error.message : "Failed to load candidate data",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadExcel = async () => {
//     if (!candidateAnalytics) return;
//     try {
//       setDownloading("excel");
//       const wb = XLSX.utils.book_new();
//       const summaryData = [
//         ["Candidate Summary", ""],
//         ["Name", candidateAnalytics.username],
//         ["Email", candidateAnalytics.email],
//         ["Total Attempts", candidateAnalytics.total_attempts],
//         ["Average Score", `${candidateAnalytics.average_score}%`],
//         ["Highest Score", `${candidateAnalytics.highest_score}%`],
//         ["Latest Attempt", candidateAnalytics.latest_attempt],
//       ];
//       const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
//       XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
//       const topicData = [["Topic", "Average %", "Highest %"]];
//       Object.entries(candidateAnalytics.topic_performance).forEach(([topic, performance]) => {
//         topicData.push([topic, performance.average.toFixed(2), performance.highest.toFixed(2)]);
//       });
//       const topicWs = XLSX.utils.aoa_to_sheet(topicData);
//       XLSX.utils.book_append_sheet(wb, topicWs, "Topic Performance");
//       const attemptsData = [["Attempt", "Quiz ID", "Score", "Passed", "Date"]];
//       candidateAnalytics.attempts.forEach((attempt) => {
//         attemptsData.push([
//           attempt.attempt.toString(),
//           attempt.quiz_id,
//           `${attempt.result.score}%`,
//           attempt.result.passed ? "Yes" : "No",
//           new Date(attempt.created_at).toLocaleDateString(),
//         ]);
//       });
//       const attemptsWs = XLSX.utils.aoa_to_sheet(attemptsData);
//       XLSX.utils.book_append_sheet(wb, attemptsWs, "All Attempts");
//       XLSX.writeFile(wb, `${candidateAnalytics.username.replace(/\s+/g, "_")}_quiz_results.xlsx`);
//       toast({ title: "Success", description: "Excel file downloaded successfully" });
//     } catch (error) {
//       console.error("Error downloading Excel:", error);
//       toast({ title: "Error", description: "Failed to download Excel file", variant: "destructive" });
//     } finally {
//       setDownloading(null);
//     }
//   };

//   const downloadPDF = async () => {
//     if (!candidateAnalytics) return;
//     try {
//       setDownloading("pdf");
//       const doc = new jsPDF();
//       doc.setFontSize(20);
//       doc.text("Candidate Quiz Report", 20, 20);
//       doc.setFontSize(12);
//       doc.text(`Name: ${candidateAnalytics.username}`, 20, 40);
//       doc.text(`Email: ${candidateAnalytics.email}`, 20, 50);
//       doc.text(`Total Attempts: ${candidateAnalytics.total_attempts}`, 20, 60);
//       doc.text(`Average Score: ${candidateAnalytics.average_score}%`, 20, 70);
//       doc.text(`Highest Score: ${candidateAnalytics.highest_score}%`, 20, 80);
//       const topicData = Object.entries(candidateAnalytics.topic_performance).map(([topic, performance]) => [
//         topic,
//         `${performance.average.toFixed(2)}%`,
//         `${performance.highest.toFixed(2)}%`,
//       ]);
//       autoTable(doc, {
//         head: [["Topic", "Average %", "Highest %"]],
//         body: topicData,
//         startY: 100,
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       const attemptsData = candidateAnalytics.attempts.map((attempt) => [
//         attempt.attempt.toString(),
//         attempt.quiz_id,
//         `${attempt.result.score}%`,
//         attempt.result.passed ? "Yes" : "No",
//         new Date(attempt.created_at).toLocaleDateString(),
//       ]);
//       autoTable(doc, {
//         head: [["Attempt", "Quiz ID", "Score", "Passed", "Date"]],
//         body: attemptsData,
//         startY: doc.lastAutoTable?.finalY || 150,
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       doc.save(`${candidateAnalytics.username.replace(/\s+/g, "_")}_quiz_results.pdf`);
//       toast({ title: "Success", description: "PDF downloaded successfully" });
//     } catch (error) {
//       console.error("Error downloading PDF:", error);
//       toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
//     } finally {
//       setDownloading(null);
//     }
//   };

//   // Score color helpers
//   const getScoreColor = (score: number) => {
//     if (score >= 80) return "text-emerald-400";
//     if (score >= 60) return "text-amber-400";
//     return "text-rose-400";
//   };

//   const getScoreRingColor = (score: number) => {
//     if (score >= 80) return "from-emerald-500 to-teal-400";
//     if (score >= 60) return "from-amber-500 to-yellow-400";
//     return "from-rose-500 to-pink-400";
//   };

//   const getTopicBarColor = (pct: number) => {
//     if (pct >= 80) return "from-emerald-500 via-teal-400 to-cyan-400";
//     if (pct >= 60) return "from-amber-500 via-orange-400 to-yellow-400";
//     return "from-rose-500 via-pink-500 to-fuchsia-500";
//   };

//   const getTopicTextColor = (pct: number) => {
//     if (pct >= 80) return "text-emerald-400";
//     if (pct >= 60) return "text-amber-400";
//     return "text-rose-400";
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-black text-white flex items-center justify-center">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   if (!candidateAnalytics) {
//     return (
//       <div className="min-h-screen bg-black text-white flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold mb-4">Candidate Not Found</h1>
//           <p className="text-gray-400 mb-6">No quiz results found for this candidate.</p>
//           <Button onClick={() => router.back()} variant="outline">
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Go Back
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#0a0a0f] text-white flex">

//       {/* Sidebar */}
//       <div className="bg-zinc-950 border-r border-zinc-800/60 shrink-0">
//         <DashboardSideBar />
//       </div>

//       {/* Main content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <DashboardHeader />

//         <main className="flex-1 overflow-y-auto">
//           <div className="p-4 lg:p-6 space-y-6">

//             {/* ── Hero Header Card ── */}
//             <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-[#12091f] to-fuchsia-950/40 p-6">
//               {/* Decorative glow blobs */}
//               <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl" />
//               <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-fuchsia-600/15 blur-3xl" />

//               <div className="relative flex items-center justify-between flex-wrap gap-4">
//                 {/* Left */}
//                 <div className="flex items-center gap-5 flex-wrap">
//                   <Button
//                     variant="ghost"
//                     onClick={() => window.close()}
//                     className="text-purple-300 hover:text-white hover:bg-purple-500/15 rounded-xl border border-purple-500/20 transition-all"
//                   >
//                     <ArrowLeft className="w-4 h-4 mr-2" />
//                     Back
//                   </Button>

//                   {/* Avatar */}
//                   <div className="relative">
//                     <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/40">
//                       <User className="w-8 h-8 text-white" />
//                     </div>
//                     <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
//                       <Sparkles className="w-2.5 h-2.5 text-emerald-900" />
//                     </div>
//                   </div>

//                   <div>
//                     <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
//                       {candidateAnalytics.username}
//                     </h1>
//                     <p className="text-gray-400 flex items-center mt-1 text-sm">
//                       <Mail className="w-4 h-4 mr-2 text-purple-400" />
//                       {candidateAnalytics.email}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Download buttons */}
//                 <div className="flex gap-3">
//                   <Button
//                     onClick={downloadExcel}
//                     disabled={downloading === "excel"}
//                     className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white border-0 shadow-lg shadow-emerald-500/25 font-semibold px-5 transition-all duration-200 hover:shadow-emerald-500/40 hover:scale-105"
//                   >
//                     {downloading === "excel" ? (
//                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     ) : (
//                       <Download className="w-4 h-4 mr-2" />
//                     )}
//                     Excel
//                   </Button>
//                   <Button
//                     onClick={downloadPDF}
//                     disabled={downloading === "pdf"}
//                     className="relative overflow-hidden bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white border-0 shadow-lg shadow-rose-500/25 font-semibold px-5 transition-all duration-200 hover:shadow-rose-500/40 hover:scale-105"
//                   >
//                     {downloading === "pdf" ? (
//                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     ) : (
//                       <Download className="w-4 h-4 mr-2" />
//                     )}
//                     PDF
//                   </Button>
//                 </div>
//               </div>
//             </div>

//             {/* ── Quick Stats ── */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {/* Total Attempts */}
//               <div className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-[#0d0818] p-5 hover:border-violet-500/40 transition-all duration-300">
//                 <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//                 <div className="flex items-center gap-4">
//                   <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3 shadow-lg shadow-violet-500/30">
//                     <FileText className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <p className="text-3xl font-bold text-white">{candidateAnalytics.total_attempts}</p>
//                     <p className="text-xs text-violet-300 mt-0.5 font-medium uppercase tracking-wide">Total Attempts</p>
//                   </div>
//                 </div>
//                 <div className="mt-3 h-1 w-full rounded-full bg-violet-900/40">
//                   <div className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 w-3/4" />
//                 </div>
//               </div>

//               {/* Average Score */}
//               <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/50 to-[#050d18] p-5 hover:border-cyan-500/40 transition-all duration-300">
//                 <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//                 <div className="flex items-center gap-4">
//                   <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-cyan-500/30">
//                     <Target className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <p className="text-3xl font-bold text-white">{candidateAnalytics.average_score}%</p>
//                     <p className="text-xs text-cyan-300 mt-0.5 font-medium uppercase tracking-wide">Average Score</p>
//                   </div>
//                 </div>
//                 <div className="mt-3 h-1 w-full rounded-full bg-cyan-900/40">
//                   <div
//                     className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400"
//                     style={{ width: `${Math.min(candidateAnalytics.average_score, 100)}%` }}
//                   />
//                 </div>
//               </div>

//               {/* Highest Score */}
//               <div className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/50 to-[#110d00] p-5 hover:border-amber-500/40 transition-all duration-300">
//                 <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//                 <div className="flex items-center gap-4">
//                   <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg shadow-amber-500/30">
//                     <Trophy className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <p className="text-3xl font-bold text-white">{candidateAnalytics.highest_score}%</p>
//                     <p className="text-xs text-amber-300 mt-0.5 font-medium uppercase tracking-wide">Highest Score</p>
//                   </div>
//                 </div>
//                 <div className="mt-3 h-1 w-full rounded-full bg-amber-900/40">
//                   <div
//                     className="h-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
//                     style={{ width: `${Math.min(candidateAnalytics.highest_score, 100)}%` }}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* ── Detailed Attempts ── */}
//             <div className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/60 to-[#0a0a0f] overflow-hidden">
//               {/* Section header */}
//               <div className="px-6 py-5 border-b border-zinc-800/60 flex items-center gap-3">
//                 <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/20">
//                   <BarChart3 className="w-5 h-5 text-purple-400" />
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-semibold text-white">Detailed Attempt Results</h2>
//                   <p className="text-xs text-zinc-500 mt-0.5">Performance breakdown for each quiz attempt</p>
//                 </div>
//               </div>

//               <div className="p-6 space-y-5">
//                 {candidateAnalytics.attempts.map((attempt, index) => (
//                   <div
//                     key={index}
//                     className="group relative overflow-hidden rounded-2xl border border-zinc-700/40 bg-gradient-to-br from-zinc-900/80 via-[#0d0d14] to-zinc-950/60 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
//                   >
//                     {/* Left accent stripe based on score */}
//                     <div
//                       className={`absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b ${getScoreRingColor(attempt.result.score)} shadow-lg`}
//                     />
                    
//                     {/* Subtle glow effect */}
//                     <div
//                       className={`absolute inset-0 bg-gradient-to-r ${getScoreRingColor(attempt.result.score)} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
//                     />

//                     <div className="pl-7 pr-6 pt-6 pb-6 relative">
//                       {/* Attempt top row */}
//                       <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
//                         {/* Left: badge + date */}
//                         <div className="flex items-center gap-4">
//                           <span className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg shadow-purple-500/30 border border-purple-400/20">
//                             <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
//                             <span className="relative">Attempt #{attempt.attempt}</span>
//                           </span>
//                           <span className="text-zinc-400 text-sm font-medium">
//                             {new Date(attempt.created_at).toLocaleDateString("en-US", {
//                               year: "numeric",
//                               month: "short",
//                               day: "numeric",
//                               hour: "2-digit",
//                               minute: "2-digit",
//                             })}
//                           </span>
//                         </div>

//                         {/* Right: score + questions */}
//                         <div className="flex items-center gap-8">
//                           <div className="text-right">
//                             <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5 font-semibold">Score</p>
//                             <div className="flex items-center gap-3">
//                               <span className={`text-3xl font-bold ${getScoreColor(attempt.result.score)} drop-shadow-sm`}>
//                                 {attempt.result.score}%
//                               </span>
//                               {attempt.result.passed && (
//                                 <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shadow-sm">
//                                   <CheckCircle2 className="w-3.5 h-3.5" /> Passed
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5 font-semibold">Correct</p>
//                             <p className="text-xl font-bold text-white">
//                               {attempt.result.correct_answers}
//                               <span className="text-zinc-500 font-normal text-base ml-1">/{attempt.result.total_questions}</span>
//                             </p>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Score progress bar */}
//                       <div className="mb-6 h-2 w-full rounded-full bg-zinc-800/60 overflow-hidden">
//                         <div
//                           className={`h-2 rounded-full bg-gradient-to-r ${getScoreRingColor(attempt.result.score)} transition-all duration-700 ease-out shadow-sm`}
//                           style={{ width: `${Math.min(attempt.result.score, 100)}%` }}
//                         />
//                       </div>

//                       {/* Topic Breakdown */}
//                       {attempt.result.topic_percentages && attempt.result.topic_percentages.length > 0 && (
//                         <div>
//                           <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2.5 uppercase tracking-wide">
//                             <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
//                               <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
//                             </div>
//                             Topic Performance
//                           </h4>
//                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {attempt.result.topic_percentages.map((topic, topicIndex) => (
//                               <div
//                                 key={topicIndex}
//                                 className="relative rounded-xl border border-zinc-700/40 bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 p-4 hover:border-zinc-600/60 transition-all duration-200 hover:shadow-md hover:shadow-zinc-900/50"
//                               >
//                                 {/* Topic header */}
//                                 <div className="flex items-start justify-between mb-3">
//                                   <h5 className="text-sm font-medium text-zinc-200 leading-tight pr-2">{topic.name}</h5>
//                                   <div className="flex items-center gap-1 shrink-0">
//                                     <span className={`text-base font-bold ${getTopicTextColor(topic.percentage)}`}>
//                                       {topic.percentage}%
//                                     </span>
//                                     {topic.percentage >= 90 && (
//                                       <Award className="w-3.5 h-3.5 text-amber-400" />
//                                     )}
//                                   </div>
//                                 </div>

//                                 {/* Correct count */}
//                                 <div className="flex justify-between text-xs text-zinc-500 mb-3">
//                                   <span className="font-medium">Correct</span>
//                                   <span className="text-zinc-300 font-semibold">
//                                     {topic.correct_questions}/{topic.total_questions}
//                                   </span>
//                                 </div>

//                                 {/* Progress bar */}
//                                 <div className="h-2 w-full rounded-full bg-zinc-800/60 overflow-hidden">
//                                   <div
//                                     className={`h-2 rounded-full bg-gradient-to-r ${getTopicBarColor(topic.percentage)} transition-all duration-700 ease-out shadow-sm`}
//                                     style={{ width: `${Math.min(topic.percentage, 100)}%` }}
//                                   />
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Additional Info */}
//                       {attempt.result.role && (
//                         <div className="mt-5 pt-5 border-t border-zinc-800/60 flex flex-wrap gap-x-8 gap-y-3">
//                           <div className="flex items-center gap-2.5 text-sm">
//                             <span className="text-zinc-500 font-medium">Role:</span>
//                             <span className="text-zinc-200 font-semibold">{attempt.result.role}</span>
//                           </div>
//                           {attempt.result.time_taken !== undefined && (
//                             <div className="flex items-center gap-2.5 text-sm">
//                               <span className="text-zinc-500 font-medium">Time Taken:</span>
//                               <span className="text-zinc-200 font-semibold">{attempt.result.time_taken} min</span>
//                             </div>
//                           )}
//                           {attempt.result.quiz_experience && (
//                             <div className="flex items-center gap-2.5 text-sm">
//                               <span className="text-zinc-500 font-medium">Experience:</span>
//                               <span className="text-zinc-200 font-semibold">{attempt.result.quiz_experience} yrs</span>
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { QuizResultAPI } from "@/lib/quizResult";
import { CandidateAnalytics } from "@/types/quizResult";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { toast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import {
  Download,
  ArrowLeft,
  User,
  Mail,
  Trophy,
  Target,
  TrendingUp,
  FileText,
  Award,
  BarChart3,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Hash,
  CalendarDays,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { companyInfo } = useCompanyInfo();

  const [candidateAnalytics, setCandidateAnalytics] = useState<CandidateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);

  const candidateEmail = params.candidateEmail as string;
  const companyId = params.companyId as string;

  useEffect(() => {
    if (candidateEmail) fetchCandidateAnalytics();
  }, [candidateEmail]);

  const fetchCandidateAnalytics = async () => {
    try {
      setLoading(true);
      const analytics = await QuizResultAPI.getCandidateAnalytics(candidateEmail);
      setCandidateAnalytics(analytics);
    } catch (error) {
      console.error("Error fetching candidate analytics:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load candidate data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (!candidateAnalytics) return;
    try {
      setDownloading("excel");
      const wb = XLSX.utils.book_new();
      const summaryData = [
        ["Candidate Summary", ""],
        ["Name", candidateAnalytics.username],
        ["Email", candidateAnalytics.email],
        ["Total Attempts", candidateAnalytics.total_attempts],
        ["Average Score", `${candidateAnalytics.average_score}%`],
        ["Highest Score", `${candidateAnalytics.highest_score}%`],
        ["Latest Attempt", candidateAnalytics.latest_attempt],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
      const topicData = [["Topic", "Average %", "Highest %"]];
      Object.entries(candidateAnalytics.topic_performance).forEach(([topic, performance]) => {
        topicData.push([topic, performance.average.toFixed(2), performance.highest.toFixed(2)]);
      });
      const topicWs = XLSX.utils.aoa_to_sheet(topicData);
      XLSX.utils.book_append_sheet(wb, topicWs, "Topic Performance");
      const attemptsData = [["Attempt", "Quiz ID", "Score", "Passed", "Date"]];
      candidateAnalytics.attempts.forEach((attempt) => {
        attemptsData.push([
          attempt.attempt.toString(),
          attempt.quiz_id,
          `${attempt.result.score}%`,
          attempt.result.passed ? "Yes" : "No",
          new Date(attempt.created_at).toLocaleDateString(),
        ]);
      });
      const attemptsWs = XLSX.utils.aoa_to_sheet(attemptsData);
      XLSX.utils.book_append_sheet(wb, attemptsWs, "All Attempts");
      XLSX.writeFile(wb, `${candidateAnalytics.username.replace(/\s+/g, "_")}_quiz_results.xlsx`);
      toast({ title: "Success", description: "Excel file downloaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download Excel file", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const downloadPDF = async () => {
    if (!candidateAnalytics) return;
    try {
      setDownloading("pdf");
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Candidate Quiz Report", 20, 20);
      doc.setFontSize(12);
      doc.text(`Name: ${candidateAnalytics.username}`, 20, 40);
      doc.text(`Email: ${candidateAnalytics.email}`, 20, 50);
      doc.text(`Total Attempts: ${candidateAnalytics.total_attempts}`, 20, 60);
      doc.text(`Average Score: ${candidateAnalytics.average_score}%`, 20, 70);
      doc.text(`Highest Score: ${candidateAnalytics.highest_score}%`, 20, 80);
      const topicData = Object.entries(candidateAnalytics.topic_performance).map(([topic, performance]) => [
        topic, `${performance.average.toFixed(2)}%`, `${performance.highest.toFixed(2)}%`,
      ]);
      autoTable(doc, { head: [["Topic", "Average %", "Highest %"]], body: topicData, startY: 100, theme: "grid", styles: { fontSize: 10 } });
      const attemptsData = candidateAnalytics.attempts.map((attempt) => [
        attempt.attempt.toString(), attempt.quiz_id, `${attempt.result.score}%`,
        attempt.result.role || "N/A", new Date(attempt.created_at).toLocaleDateString(),
      ]);
      autoTable(doc, { head: [["Attempt", "Quiz ID", "Score", "Quiz Role", "Date"]], body: attemptsData, startY: doc.lastAutoTable?.finalY || 150, theme: "grid", styles: { fontSize: 10 } });
      doc.save(`${candidateAnalytics.username.replace(/\s+/g, "_")}_quiz_results.pdf`);
      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  // ── Score-based style helpers ──────────────────────────────────────────────
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { label: "Excellent", emoji: "🏆" };
    if (score >= 80) return { label: "Great",     emoji: "⭐" };
    if (score >= 60) return { label: "Good",      emoji: "👍" };
    if (score >= 40) return { label: "Fair",      emoji: "📈" };
    return               { label: "Needs Work",  emoji: "💪" };
  };

  const scoreStyles = (score: number) => {
    if (score >= 80) return {
      text:       "text-emerald-400",
      bar:        "from-emerald-500 via-teal-400 to-cyan-400",
      stripe:     "from-emerald-500 to-teal-500",
      glow:       "shadow-emerald-500/20",
      border:     "hover:border-emerald-500/30",
      badgeBg:    "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
      labelBg:    "bg-emerald-500/10",
      labelText:  "text-emerald-300",
    };
    if (score >= 60) return {
      text:       "text-amber-400",
      bar:        "from-amber-500 via-orange-400 to-yellow-400",
      stripe:     "from-amber-500 to-orange-500",
      glow:       "shadow-amber-500/20",
      border:     "hover:border-amber-500/30",
      badgeBg:    "bg-amber-500/10 border-amber-500/25 text-amber-400",
      labelBg:    "bg-amber-500/10",
      labelText:  "text-amber-300",
    };
    return {
      text:       "text-rose-400",
      bar:        "from-rose-500 via-pink-500 to-fuchsia-500",
      stripe:     "from-rose-500 to-pink-500",
      glow:       "shadow-rose-500/20",
      border:     "hover:border-rose-500/30",
      badgeBg:    "bg-rose-500/10 border-rose-500/25 text-rose-400",
      labelBg:    "bg-rose-500/10",
      labelText:  "text-rose-300",
    };
  };

  const topicStyles = (pct: number) => {
    if (pct >= 80) return { bar: "from-emerald-500 via-teal-400 to-cyan-400", text: "text-emerald-400", bg: "bg-emerald-500/8" };
    if (pct >= 60) return { bar: "from-amber-500 via-orange-400 to-yellow-400", text: "text-amber-400",   bg: "bg-amber-500/8"  };
    return               { bar: "from-rose-500 via-pink-500 to-fuchsia-500",   text: "text-rose-400",    bg: "bg-rose-500/8"   };
  };

  // ── Loading / not-found states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090f] text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!candidateAnalytics) {
    return (
      <div className="min-h-screen bg-[#09090f] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Candidate Not Found</h1>
          <p className="text-gray-400 mb-6">No quiz results found for this candidate.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090f] text-white flex">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div className="bg-zinc-950 border-r border-zinc-800/60 shrink-0">
        <DashboardSideBar />
      </div>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto">

            {/* ── Hero Header ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#130a24] via-[#0f0818] to-[#140722] p-6">
              <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-3xl" />

              <div className="relative flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-5 flex-wrap">
                  <Button
                    variant="ghost"
                    onClick={() => window.close()}
                    className="text-purple-300 hover:text-white hover:bg-purple-500/15 rounded-xl border border-purple-500/25 text-sm font-medium transition-all"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>

                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full border-2 border-[#09090f] flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-900" />
                    </div>
                  </div>

                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-violet-200 via-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
                      {candidateAnalytics.username}
                    </h1>
                    <p className="text-zinc-400 flex items-center mt-1 text-sm">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                      {candidateAnalytics.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={downloadExcel}
                    disabled={downloading === "excel"}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white border-0 shadow-lg shadow-emerald-500/20 font-semibold px-5 transition-all duration-200 hover:shadow-emerald-500/35 hover:scale-[1.03]"
                  >
                    {downloading === "excel" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Excel
                  </Button>
                  <Button
                    onClick={downloadPDF}
                    disabled={downloading === "pdf"}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white border-0 shadow-lg shadow-rose-500/20 font-semibold px-5 transition-all duration-200 hover:shadow-rose-500/35 hover:scale-[1.03]"
                  >
                    {downloading === "pdf" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Quick Stats ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <FileText className="w-5 h-5 text-white" />,
                  iconBg: "from-violet-500 to-purple-600",
                  iconGlow: "shadow-violet-500/30",
                  border: "border-violet-500/20 hover:border-violet-500/40",
                  label: "Total Attempts",
                  labelColor: "text-violet-300",
                  value: candidateAnalytics.total_attempts,
                  suffix: "",
                  barColor: "from-violet-500 to-purple-400",
                  barBg: "bg-violet-900/30",
                  barWidth: "75%",
                },
                {
                  icon: <Target className="w-5 h-5 text-white" />,
                  iconBg: "from-cyan-500 to-blue-600",
                  iconGlow: "shadow-cyan-500/30",
                  border: "border-cyan-500/20 hover:border-cyan-500/40",
                  label: "Average Score",
                  labelColor: "text-cyan-300",
                  value: candidateAnalytics.average_score,
                  suffix: "%",
                  barColor: "from-cyan-500 to-blue-400",
                  barBg: "bg-cyan-900/30",
                  barWidth: `${Math.min(candidateAnalytics.average_score, 100)}%`,
                },
                {
                  icon: <Trophy className="w-5 h-5 text-white" />,
                  iconBg: "from-amber-500 to-orange-600",
                  iconGlow: "shadow-amber-500/30",
                  border: "border-amber-500/20 hover:border-amber-500/40",
                  label: "Highest Score",
                  labelColor: "text-amber-300",
                  value: candidateAnalytics.highest_score,
                  suffix: "%",
                  barColor: "from-amber-500 to-orange-400",
                  barBg: "bg-amber-900/30",
                  barWidth: `${Math.min(candidateAnalytics.highest_score, 100)}%`,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl border ${stat.border} bg-[#0d0d14] p-5 transition-all duration-300 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center shadow-lg ${stat.iconGlow} shrink-0`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white leading-none">
                        {stat.value}{stat.suffix}
                      </p>
                      <p className={`text-xs ${stat.labelColor} mt-1 font-semibold uppercase tracking-widest`}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                  <div className={`h-1.5 w-full rounded-full ${stat.barBg} overflow-hidden`}>
                    <div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${stat.barColor}`}
                      style={{ width: stat.barWidth }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Detailed Attempts ───────────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-800/50 bg-[#0d0d14] overflow-hidden">
              {/* Section header */}
              <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/12 border border-purple-500/20">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Detailed Attempt Results</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Performance breakdown for each quiz attempt</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {candidateAnalytics.attempts.map((attempt, index) => {
                  const s   = scoreStyles(attempt.result.score);
                  const grade = getScoreGrade(attempt.result.score);

                  return (
                    <div
                      key={index}
                      className={`group relative overflow-hidden rounded-2xl border border-zinc-800/50 ${s.border} bg-[#0a0a10] transition-all duration-300 hover:shadow-xl ${s.glow}`}
                    >
                      {/* Colored top border accent */}
                      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${s.stripe}`} />

                      {/* Very subtle score-tinted bg */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${s.stripe} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300`} />

                      <div className="relative p-5">

                        {/* ── Top row: badge + date | score + questions ── */}
                        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">

                          {/* Left: attempt label + date */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md shadow-purple-500/20 border border-purple-400/15">
                                <Hash className="w-3 h-3" />
                                Attempt {attempt.attempt}
                              </span>
                              {/* Grade pill */}
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badgeBg}`}>
                                <span>{grade.emoji}</span>
                                <span>{grade.label}</span>
                              </span>
                            </div>
                            <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {new Date(attempt.created_at).toLocaleDateString("en-US", {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Right: score display */}
                          <div className="flex items-center gap-5">
                            <div className="text-center">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Score</p>
                              <p className={`text-4xl font-black tabular-nums ${s.text} leading-none`}>
                                {attempt.result.score}
                                <span className="text-xl font-bold">%</span>
                              </p>
                            </div>
                            <div className="w-px h-10 bg-zinc-800" />
                            <div className="text-center">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Correct</p>
                              <p className="text-2xl font-bold text-white leading-none">
                                {attempt.result.correct_answers}
                                <span className="text-zinc-600 font-normal text-base">/{attempt.result.total_questions}</span>
                              </p>
                            </div>
                                                      </div>
                        </div>

                        {/* ── Score progress bar ── */}
                        <div className="mb-5 h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${s.bar} transition-all duration-700 ease-out`}
                            style={{ width: `${Math.min(attempt.result.score, 100)}%` }}
                          />
                        </div>

                        {/* ── Topic Breakdown ── */}
                        {attempt.result.topic_percentages && attempt.result.topic_percentages.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 rounded-lg bg-purple-500/12 border border-purple-500/20">
                                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                              </div>
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                Topic Performance
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {attempt.result.topic_percentages.map((topic, topicIndex) => {
                                const ts = topicStyles(topic.percentage);
                                return (
                                  <div
                                    key={topicIndex}
                                    className="relative rounded-xl border border-zinc-800/60 bg-[#0d0d16] p-4 hover:border-zinc-700/60 transition-all duration-200"
                                  >
                                    {/* Topic name + % */}
                                    <div className="flex items-start justify-between mb-2.5">
                                      <h5 className="text-sm font-semibold text-zinc-200 leading-snug pr-3 max-w-[70%]">
                                        {topic.name}
                                      </h5>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={`text-lg font-black tabular-nums ${ts.text} leading-none`}>
                                          {topic.percentage}%
                                        </span>
                                        {topic.percentage >= 90 && (
                                          <Award className="w-4 h-4 text-amber-400 shrink-0" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Correct count chip */}
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-xs text-zinc-500 font-medium">Correct answers</span>
                                      <span className="text-xs font-bold text-zinc-300 tabular-nums">
                                        {topic.correct_questions}/{topic.total_questions}
                                      </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full bg-gradient-to-r ${ts.bar} transition-all duration-700 ease-out`}
                                        style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ── Meta info row ── */}
                        {attempt.result.role && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/50">
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2 text-xs">
                                <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50">
                                  <Briefcase className="w-3 h-3 text-zinc-400" />
                                </div>
                                <span className="text-zinc-500 font-medium">Role</span>
                                <span className="text-zinc-200 font-semibold">{attempt.result.role}</span>
                              </div>
                              {attempt.result.time_taken !== undefined && (
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50">
                                    <Clock className="w-3 h-3 text-zinc-400" />
                                  </div>
                                  <span className="text-zinc-500 font-medium">Time Taken</span>
                                  <span className="text-zinc-200 font-semibold">{attempt.result.time_taken} min</span>
                                </div>
                              )}
                              {attempt.result.quiz_experience && (
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50">
                                    <Zap className="w-3 h-3 text-zinc-400" />
                                  </div>
                                  <span className="text-zinc-500 font-medium">Experience</span>
                                  <span className="text-zinc-200 font-semibold">{attempt.result.quiz_experience} yrs</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}