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
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

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
      console.error('Error fetching candidate analytics:', error);
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
      setDownloading('excel');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Candidate Summary', ''],
        ['Name', candidateAnalytics.username],
        ['Email', candidateAnalytics.email],
        ['Total Attempts', candidateAnalytics.total_attempts],
        ['Average Score', `${candidateAnalytics.average_score}%`],
        ['Highest Score', `${candidateAnalytics.highest_score}%`],
        ['Latest Attempt', candidateAnalytics.latest_attempt],
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Topic performance sheet
      const topicData = [['Topic', 'Average %', 'Highest %']];
      Object.entries(candidateAnalytics.topic_performance).forEach(([topic, performance]) => {
        topicData.push([topic, performance.average.toFixed(2), performance.highest.toFixed(2)]);
      });
      
      const topicWs = XLSX.utils.aoa_to_sheet(topicData);
      XLSX.utils.book_append_sheet(wb, topicWs, 'Topic Performance');
      
      // Detailed attempts sheet
      const attemptsData = [['Attempt', 'Quiz ID', 'Score', 'Passed', 'Date']];
      candidateAnalytics.attempts.forEach(attempt => {
        attemptsData.push([
          attempt.attempt.toString(),
          attempt.quiz_id,
          `${attempt.result.score}%`,
          attempt.result.passed ? 'Yes' : 'No',
          new Date(attempt.created_at).toLocaleDateString()
        ]);
      });
      
      const attemptsWs = XLSX.utils.aoa_to_sheet(attemptsData);
      XLSX.utils.book_append_sheet(wb, attemptsWs, 'All Attempts');
      
      // Download the file
      XLSX.writeFile(wb, `${candidateAnalytics.username.replace(/\s+/g, '_')}_quiz_results.xlsx`);
      
      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({
        title: "Error",
        description: "Failed to download Excel file",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const downloadPDF = async () => {
    if (!candidateAnalytics) return;
    
    try {
      setDownloading('pdf');
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Candidate Quiz Report', 20, 20);
      
      // Add candidate info
      doc.setFontSize(12);
      doc.text(`Name: ${candidateAnalytics.username}`, 20, 40);
      doc.text(`Email: ${candidateAnalytics.email}`, 20, 50);
      doc.text(`Total Attempts: ${candidateAnalytics.total_attempts}`, 20, 60);
      doc.text(`Average Score: ${candidateAnalytics.average_score}%`, 20, 70);
      doc.text(`Highest Score: ${candidateAnalytics.highest_score}%`, 20, 80);
      
      // Add topic performance table
      const topicData = Object.entries(candidateAnalytics.topic_performance).map(([topic, performance]) => [
        topic,
        `${performance.average.toFixed(2)}%`,
        `${performance.highest.toFixed(2)}%`
      ]);
      
      autoTable(doc, {
        head: [['Topic', 'Average %', 'Highest %']],
        body: topicData,
        startY: 100,
        theme: 'grid',
        styles: { fontSize: 10 },
      });
      
      // Add attempts table
      const attemptsData = candidateAnalytics.attempts.map(attempt => [
        attempt.attempt.toString(),
        attempt.quiz_id,
        `${attempt.result.score}%`,
        attempt.result.passed ? 'Yes' : 'No',
        new Date(attempt.created_at).toLocaleDateString()
      ]);
      
      autoTable(doc, {
        head: [['Attempt', 'Quiz ID', 'Score', 'Passed', 'Date']],
        body: attemptsData,
        startY: doc.lastAutoTable?.finalY || 150,
        theme: 'grid',
        styles: { fontSize: 10 },
      });
      
      // Save the PDF
      doc.save(`${candidateAnalytics.username.replace(/\s+/g, '_')}_quiz_results.pdf`);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
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
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <User className="w-8 h-8 mr-3" />
                  {candidateAnalytics.username}
                </h1>
                <p className="text-gray-400 flex items-center mt-1">
                  <Mail className="w-4 h-4 mr-2" />
                  {candidateAnalytics.email}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={downloadExcel}
                disabled={downloading === 'excel'}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                {downloading === 'excel' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Excel
              </Button>
              <Button
                onClick={downloadPDF}
                disabled={downloading === 'pdf'}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                {downloading === 'pdf' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{candidateAnalytics.total_attempts}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{candidateAnalytics.average_score}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Highest Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{candidateAnalytics.highest_score}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Latest Attempt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">#{candidateAnalytics.latest_attempt}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topic Performance */}
          <Card className="bg-zinc-900 border-zinc-800 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Topic Performance
              </CardTitle>
              <CardDescription>
                Performance breakdown by topic across all attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(candidateAnalytics.topic_performance).map(([topic, performance]) => (
                  <div key={topic} className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{topic}</h3>
                      {performance.highest >= 90 && (
                        <Badge className="bg-yellow-600 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          Highest
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Average:</span>
                        <span className="font-medium">{performance.average.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Highest:</span>
                        <span className="font-medium text-green-400">{performance.highest.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(performance.average, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Attempts */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Table className="w-5 h-5 mr-2" />
                All Attempts
              </CardTitle>
              <CardDescription>
                Detailed results for each quiz attempt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3 px-4">Attempt</th>
                      <th className="text-left py-3 px-4">Quiz ID</th>
                      <th className="text-left py-3 px-4">Score</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidateAnalytics.attempts.map((attempt, index) => (
                      <tr key={index} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="py-3 px-4">#{attempt.attempt}</td>
                        <td className="py-3 px-4 font-mono text-sm">{attempt.quiz_id}</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            attempt.result.score >= 80 ? 'text-green-400' : 
                            attempt.result.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {attempt.result.score}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={attempt.result.passed ? 'bg-green-600' : 'bg-red-600'}>
                            {attempt.result.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
