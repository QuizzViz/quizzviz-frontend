"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { QuizResultAPI } from "@/lib/quizResult";
import { CandidateAnalytics } from "@/types/quizResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  FileText,
  Table,
  Award,
  BarChart3,
  Loader2,
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
    if (candidateEmail) {
      fetchCandidateAnalytics();
    }
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
      console.error("Error downloading Excel:", error);
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
        topic,
        `${performance.average.toFixed(2)}%`,
        `${performance.highest.toFixed(2)}%`,
      ]);

      autoTable(doc, {
        head: [["Topic", "Average %", "Highest %"]],
        body: topicData,
        startY: 100,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      const attemptsData = candidateAnalytics.attempts.map((attempt) => [
        attempt.attempt.toString(),
        attempt.quiz_id,
        `${attempt.result.score}%`,
        attempt.result.passed ? "Yes" : "No",
        new Date(attempt.created_at).toLocaleDateString(),
      ]);

      autoTable(doc, {
        head: [["Attempt", "Quiz ID", "Score", "Passed", "Date"]],
        body: attemptsData,
        startY: doc.lastAutoTable?.finalY || 150,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      doc.save(`${candidateAnalytics.username.replace(/\s+/g, "_")}_quiz_results.pdf`);

      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!candidateAnalytics) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Candidate Not Found</h1>
          <p className="text-gray-400 mb-6">No quiz results found for this candidate.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSideBar />
      <div className="lg:pl-64">
        <DashboardHeader />

        <div className="p-4 lg:p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 mb-8 border border-purple-500/30">
            <div className="flex items-center justify-between">
              {/* Left: Back button + candidate info */}
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  onClick={() => window.close()}
                  className="text-purple-300 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Analytics
                </Button>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {candidateAnalytics.username}
                    </h1>
                    <p className="text-gray-300 text-lg flex items-center mt-1">
                      <Mail className="w-5 h-5 mr-2 text-purple-400" />
                      {candidateAnalytics.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Download buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={downloadExcel}
                  disabled={downloading === "excel"}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg shadow-green-500/30"
                >
                  {downloading === "excel" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Excel
                </Button>
                <Button
                  onClick={downloadPDF}
                  disabled={downloading === "pdf"}
                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-lg shadow-red-500/30"
                >
                  {downloading === "pdf" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-300">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{candidateAnalytics.total_attempts}</div>
                    <div className="text-xs text-purple-300">Quiz completions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border-emerald-500/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-300">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{candidateAnalytics.average_score}%</div>
                    <div className="text-xs text-emerald-300">Overall performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-300">Highest Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mr-4">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{candidateAnalytics.highest_score}%</div>
                    <div className="text-xs text-amber-300">Best performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Attempts */}
          <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                Detailed Attempt Results
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Performance breakdown for each quiz attempt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {candidateAnalytics.attempts.map((attempt, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-xl p-6 border border-zinc-700/50"
                  >
                    {/* Attempt Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg shadow-purple-500/30">
                          Attempt #{attempt.attempt}
                        </div>
                        <div className="text-zinc-300 text-sm">
                          {new Date(attempt.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">Overall Score</p>
                          <div className="flex items-center">
                            <p
                              className={`text-2xl font-bold ${
                                attempt.result.score >= 80
                                  ? "text-green-400"
                                  : attempt.result.score >= 60
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {attempt.result.score}%
                            </p>
                            {attempt.result.passed && (
                              <Badge className="ml-2 bg-green-600 text-white">Passed</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">Questions</p>
                          <p className="text-lg font-semibold text-white">
                            {attempt.result.correct_answers}/{attempt.result.total_questions}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Topic Breakdown */}
                    {attempt.result.topic_percentages && attempt.result.topic_percentages.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                          Topic Performance
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {attempt.result.topic_percentages.map((topic, topicIndex) => (
                            <div
                              key={topicIndex}
                              className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 rounded-lg p-4 border border-zinc-600/50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-white">{topic.name}</h5>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-lg font-bold ${
                                      topic.percentage >= 80
                                        ? "text-emerald-400"
                                        : topic.percentage >= 60
                                        ? "text-amber-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {topic.percentage}%
                                  </span>
                                  {topic.percentage >= 90 && <Award className="w-4 h-4 text-yellow-400" />}
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-zinc-300">
                                  <span>Correct:</span>
                                  <span className="text-white">
                                    {topic.correct_questions}/{topic.total_questions}
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      topic.percentage >= 80
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                        : topic.percentage >= 60
                                        ? "bg-gradient-to-r from-amber-500 to-amber-600"
                                        : "bg-gradient-to-r from-red-500 to-red-600"
                                    }`}
                                    style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    {attempt.result.role && (
                      <div className="mt-4 pt-4 border-t border-zinc-700/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Role:</span>
                          <span className="text-white font-medium">{attempt.result.role}</span>
                        </div>
                        {attempt.result.time_taken !== undefined && (
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-zinc-400">Time Taken:</span>
                            <span className="text-white font-medium">{attempt.result.time_taken} min</span>
                          </div>
                        )}
                        {attempt.result.quiz_experience && (
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-zinc-400">Experience Level:</span>
                            <span className="text-white font-medium">{attempt.result.quiz_experience} years</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}