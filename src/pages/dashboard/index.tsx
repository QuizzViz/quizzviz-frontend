"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

import { LogoWithText } from "@/components/LogoWithText";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";
import CreateQuizCard from "@/components/CreateQuizCard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Star, FileText, Clock } from "lucide-react";

// Sample data
const queuedQuizzes = [
  { id: 1, title: "Data Structures Quiz", scheduled: "2025-09-10", status: "generating", progress: 60 },
  { id: 2, title: "Algorithms Challenge", scheduled: "2025-09-12", status: "queued", progress: 0 },
  { id: 3, title: "Python Programming", scheduled: "2025-09-15", status: "queued", progress: 0 },
];

const previousQuizzes = [
  { id: 1, title: "JavaScript Fundamentals", questions: 15, completed: 120, rating: 4.5, subject: "JavaScript", difficulty: "Easy" },
  { id: 2, title: "Python for Data Science", questions: 20, completed: 95, rating: 4.8, subject: "Python", difficulty: "Medium" },
  { id: 3, title: "Algorithms and Data Structures", questions: 10, completed: 80, rating: 4.2, subject: "Computer Science", difficulty: "Hard" },
  { id: 4, title: "React Hooks & State Management", questions: 12, completed: 50, rating: 4.7, subject: "React", difficulty: "Medium" },
  { id: 5, title: "Node.js & Express Basics", questions: 18, completed: 60, rating: 4.4, subject: "Node.js", difficulty: "Medium" },
];

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) router.push("/signin");
    else if (isLoaded) setIsLoading(false);
  }, [isLoaded, user, router]);

  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SignedIn>
        <div className="flex min-h-screen">
          {/* Sidebar - WHITE */}
          <div className="bg-white border-r border-white">
  <DashboardSideBar />
</div>

            

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header - BLACK + WHITE text/icons + border */}
            <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
              <LogoWithText className="h-8 text-white" />
              <UserAvatarDropdown
                userName={user?.fullName || user?.firstName || "User"}
                userEmail={user?.emailAddresses?.[0]?.emailAddress}
              />
            </header>

            {/* Main area */}
            <main className="flex-1 p-6 space-y-8">
              <CreateQuizCard />

              {/* Generation Queue */}
              <Card className="bg-black border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="bg-gray-200 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-black" />
                    </div>
                    <span className="text-white">Generation Queue</span>
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-gray-200 text-black hover:bg-white hover:text-black transition-colors duration-300"
                    >
                      {queuedQuizzes.length} active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {queuedQuizzes.map((quiz) => (
                      <Card
                        key={quiz.id}
                        className="group border-border bg-black cursor-pointer transform transition-all duration-300 hover:scale-105"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-lg">{quiz.title}</h4>
                              <div className="flex items-center space-x-3 mt-2">
                                <Badge
                                  variant={quiz.status === "generating" ? "default" : "secondary"}
                                  className={`${
                                    quiz.status === "generating"
                                      ? "bg-gray-200 text-black hover:bg-white hover:text-black"
                                      : "bg-black text-gray-200 border-border hover:bg-white hover:text-black"
                                  } transition-colors duration-300`}
                                >
                                  {quiz.status}
                                </Badge>
                                {quiz.status === "generating" && (
                                  <div className="flex items-center space-x-2">
                                    <Progress value={quiz.progress} className="w-32 h-2 bg-gray-200" />
                                    <span className="text-sm text-gray-200 font-medium">{quiz.progress}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quiz Library */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-200">Your Quiz Library</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-200">
                    <span>{previousQuizzes.length} quizzes</span>
                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    <span>Ready to deploy</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {previousQuizzes.map((quiz) => (
                    <Card
                      key={quiz.id}
                      className="group bg-black hover:bg-black transition-all duration-500 ease-out transform hover:scale-105 cursor-pointer border-gray-200 hover:border-white hover:shadow-xl"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-gray-200 group-hover:text-white line-clamp-2 transition-colors duration-300">
                          {quiz.title}
                        </CardTitle>
                        <FileText className="h-4 w-4 text-gray-200 group-hover:text-white flex-shrink-0 transition-colors duration-300" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-200 group-hover:text-white transition-colors duration-300">
                          {quiz.questions}
                        </div>
                        <div className="text-xs text-gray-200 group-hover:text-gray-200 transition-colors duration-300">
                          Questions
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-200 group-hover:text-white mt-3 transition-colors duration-300">
                          <Users className="h-3 w-3" />
                          <span>{quiz.completed} completed</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-200 group-hover:text-white mt-1 transition-colors duration-300">
                          <Star className="h-3 w-3" />
                          <span>{quiz.rating}/5.0 rating</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Badge
                            variant="secondary"
                            className="bg-gray-200 text-black group-hover:bg-white group-hover:text-black transition-colors duration-300"
                          >
                            {quiz.subject}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-200 text-gray-200 group-hover:border-white group-hover:text-white transition-all duration-300"
                          >
                            {quiz.difficulty}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </main>
          </div>
        </div>
      </SignedIn>

      {/* Redirect to Sign In */}
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">
              Redirecting to sign in...
            </h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
