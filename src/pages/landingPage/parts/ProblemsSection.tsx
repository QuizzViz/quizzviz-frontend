'use client';

import React, { FC } from "react";
import { Clock, CheckCircle, Zap, User, Briefcase } from "lucide-react";
import { UserType, useUserType } from "@/contexts/UserTypeContext";

const Card: FC<{ className?: string, children: React.ReactNode }> = ({ className, children }) => (
    <div className={`shadow-xl ${className || ''}`}>
        {children}
    </div>
);
const CardContent: FC<{ className?: string, children: React.ReactNode }> = ({ className, children }) => (
    <div className={`p-6 ${className || ''}`}>
        {children}
    </div>
);

const ProblemsSection: FC = () => {
  const { userType: selectedUser, setUserType: setSelectedUser } = useUserType();

  const contentByUser: Record<UserType, { speed: string, accuracy: string, efficiency: string }> = {
    individual: {
      speed: "Generate coding quizzes in minutes that test technical concepts through real-world based scenarios. Perfect for quick practice sessions and skill assessment.",
      accuracy: "Secure proctored mode with full-screen lockdown ensures honest self-evaluation. Auto-end on distractions keeps your practice focused and meaningful.",
      efficiency: "Get instant feedback with personalized growth insights. Track your progress over time and identify areas for improvement with detailed analytics."
    },
    business: {
      speed: "Generate coding quizzes in minutes that test technical concepts through real-world based scenarios. Screen candidates faster and more effectively.",
      accuracy: "Cheat-proof hiring with secure proctored assessments. Full-screen lockdown and auto-end on distractions ensure fair evaluation of all candidates.",
      efficiency: "Make confident hiring decisions with actionable data. Download candidate results, apply filters, view performance graphs, and analyze data in comprehensive tables for smarter, faster recruitment."
    }
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-background to-background/95">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/2 right-1/4 w-96 h-96 bg-gradient-to-l from-purple-500/10 to-green-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Removed external animation classes (scroll-fade, animate-fade-in) */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6 bg-clip-text">
            Problems We 
            {/* Custom .gradient-text replaced with pure Tailwind for transparent text effect */}
            <span className="font-medium ml-3 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Solve
            </span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-90 mb-8">
            Whether you're an individual honing your skills or a growing team building your talent pipeline, our AI-powered solutions help you create effective coding assessments with proctoring that save time, ensure fairness, and deliver real insights.
          </p>
          
          {/* User Type Toggle */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-6 sm:mt-8 w-full px-2">
            <button
              onClick={() => setSelectedUser('individual')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-300 ${
                selectedUser === 'individual'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Individual</span>
              {selectedUser === 'individual' && (
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs whitespace-nowrap">
                  Selected
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedUser('business')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-300 ${
                selectedUser === 'business'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Business</span>
              {selectedUser === 'business' && (
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs whitespace-nowrap">
                  Selected
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Card 1: Speed */}
          <Card 
            // Custom .glassmorphism/scroll-fade replaced with Tailwind: backdrop-blur-xl border border-white/10 bg-white/5
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden"
          >
            <CardContent className="p-8 text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/80 to-blue-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-green-500/30 hover:animate-pulse">
                <Clock className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Speed</h3>
              <p className="text-muted-foreground leading-relaxed text-sm opacity-90 mx-auto">
                {contentByUser[selectedUser].speed}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Accuracy */}
          <Card 
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden"
          >
            <CardContent className="p-8 text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-blue-500/30 hover:animate-pulse">
                <CheckCircle className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Accuracy</h3>
              <p className="text-muted-foreground leading-relaxed text-sm opacity-90 mx-auto">
                {contentByUser[selectedUser].accuracy}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Efficiency */}
          <Card 
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden"
          >
            <CardContent className="p-8 text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/80 to-green-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-purple-500/30 hover:animate-pulse">
                <Zap className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Efficiency</h3>
              <p className="text-muted-foreground leading-relaxed text-sm opacity-90 mx-auto">
                {contentByUser[selectedUser].efficiency}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
