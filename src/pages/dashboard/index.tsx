"use client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import LogoutButton from "@/components/auth/LogoutButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Send,
  Clock,
  Users,
  BookOpen,
  Settings,
  History,
  Star,
  FileText,
  BarChart3,
  Home,
  Plus,
  Search,
  Sparkles,
  Zap,
  Target,
  Sidebar,
} from "lucide-react";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";

const sidebarItems = [
  { id: 1, label: "Dashboard", icon: Home, link: "/dashboard", active: true },
  { id: 2, label: "Quizzes", icon: BookOpen, link: "/quizzes", active: false },
  { id: 3, label: "Results", icon: BarChart3, link: "/results", active: false },
  { id: 4, label: "Profile", icon: Users, link: "/profile", active: false },
  { id: 5, label: "Settings", icon: Settings, link: "/settings", active: false },
];
// Queued quizzes with status & progress for the progress bar
const queuedQuizzes = [
  { id: 1, title: "Geography Quiz", scheduled: "2025-09-10", status: "generating", progress: 60 },
  { id: 2, title: "Physics Challenge", scheduled: "2025-09-12", status: "queued", progress: 0 },
  { id: 3, title: "English Grammar", scheduled: "2025-09-15", status: "queued", progress: 0 },
];
// Previous quizzes with all fields used in your cards
const previousQuizzes = [
  {
    id: 1,
    title: "Math Basics",
    questions: 15,
    completed: 120,
    rating: 4.5,
    subject: "Mathematics",
    difficulty: "Easy",
  },
  {
    id: 2,
    title: "Science Quiz",
    questions: 20,
    completed: 95,
    rating: 4.8,
    subject: "Science",
    difficulty: "Medium",
  },
  {
    id: 3,
    title: "History Test",
    questions: 10,
    completed: 80,
    rating: 4.2,
    subject: "History",
    difficulty: "Hard",
  },
  {
    id: 4,
    title: "React Hooks",
    questions: 12,
    completed: 50,
    rating: 4.7,
    subject: "Programming",
    difficulty: "Medium",
  },
  {
    id: 5,
    title: "World Geography",
    questions: 18,
    completed: 60,
    rating: 4.4,
    subject: "Geography",
    difficulty: "Medium",
  },
];

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="min-h-screen">
      <SignedIn>
        <div className="flex min-h-screen bg-background dark">
          <DashboardSideBar/>
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground">
                  {/* <span className="text-muted-foreground">Intelligent</span>{" "} */}
                  <span className="text-foreground">Intelligent Quiz Generation</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Transform hiring with AI-powered assessments in seconds
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* <Button variant="outline" size="sm" className="border-border hover:border-foreground bg-transparent">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button> */}
                {/* <span className="ml-4">Welcome, {user?.firstName || "User"}!</span> */}
                <div className="flex flex-row flex-wrap items-center gap-12">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      
      </div>
                <LogoutButton />
              </div>
            </div>

            <div className="flex-1 p-6 space-y-8">
              {/* Create Quiz Card */}
              <Card className="bg-card border-border">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground rounded-full mb-4">
                      <Sparkles className="h-8 w-8 text-background" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Create Your Next Quiz</h2>
                    <p className="text-muted-foreground">
                      Describe your vision and watch AI bring it to life
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder="e.g., 'Create a 15-question React hooks quiz...' "
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground/70 pr-12 py-6 text-lg focus:border-foreground"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="bg-foreground hover:bg-muted-foreground text-background transition-all duration-200 px-8"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Queue */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="bg-foreground p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-background" />
                    </div>
                    <span className="text-foreground">Generation Queue</span>
                    <Badge variant="secondary" className="ml-auto bg-muted text-foreground">
                      {queuedQuizzes.length} active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {queuedQuizzes.map((quiz) => (
                      <Card key={quiz.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-lg">{quiz.title}</h4>
                              <div className="flex items-center space-x-3 mt-2">
                                <Badge
                                  variant={quiz.status === "generating" ? "default" : "secondary"}
                                  className={quiz.status === "generating" ? "bg-foreground text-background" : "bg-muted text-foreground"}
                                >
                                  {quiz.status}
                                </Badge>
                                {quiz.status === "generating" && (
                                  <div className="flex items-center space-x-2">
                                    <Progress value={quiz.progress} className="w-32 h-2" />
                                    <span className="text-sm text-foreground font-medium">{quiz.progress}%</span>
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
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-foreground">Your Quiz Library</h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{previousQuizzes.length} quizzes</span>
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <span>Ready to deploy</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {previousQuizzes.map((quiz) => (
                    <Card
                      key={quiz.id}
                      className="group bg-card hover:bg-background transition-all duration-500 ease-out transform hover:scale-105 cursor-pointer border-border hover:border-foreground hover:shadow-xl"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-card-foreground group-hover:text-foreground line-clamp-2 transition-colors duration-300">
                          {quiz.title}
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors duration-300" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-card-foreground group-hover:text-foreground transition-colors duration-300">
                          {quiz.questions}
                        </div>
                        <div className="text-xs text-muted-foreground group-hover:text-muted-foreground transition-colors duration-300">
                          Questions
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground group-hover:text-foreground mt-3 transition-colors duration-300">
                          <Users className="h-3 w-3" />
                          <span>{quiz.completed} completed</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground group-hover:text-foreground mt-1 transition-colors duration-300">
                          <Star className="h-3 w-3" />
                          <span>{quiz.rating}/5.0 rating</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Badge
                            variant="secondary"
                            className="bg-muted text-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300"
                          >
                            {quiz.subject}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs border-muted-foreground text-muted-foreground group-hover:border-foreground group-hover:text-foreground transition-all duration-300"
                          >
                            {quiz.difficulty}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <p>You are signed out. Please sign in first.</p>
        </div>
      </SignedOut>
    </div>
  );
}
