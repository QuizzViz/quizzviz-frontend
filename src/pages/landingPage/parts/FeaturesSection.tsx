"use client";
import React, { FC, useState } from "react";
import { Zap, CheckCircle, BarChart3,User, Briefcase, BookOpen, Share2 } from "lucide-react";
import { useUserType, type UserType } from "@/contexts/UserTypeContext";





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

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  gradient: string;
  ring: string;
}

const FeaturesSection: FC = () => {
  const { userType: selectedUser, setUserType: setSelectedUser } = useUserType();

  const features: Record<UserType, Feature[]> = {
    individual: [
      {
        icon: Zap,
        title: "AI-Powered Generation",
        description: "Generate coding quizzes in minutes with AI, customized by difficulty and mix. Perfect for instant practice sessions.",
        gradient: "from-green-500/80 to-blue-500/80",
        ring: "ring-green-500/30"
      },
      {
        icon: CheckCircle,
        title: "Secure Proctoring",
        description: "Full-screen lockdown and auto-end on tab switches ensure focused practice. Set custom quiz durations for time-bound practice.",
        gradient: "from-blue-500/80 to-purple-500/80",
        ring: "ring-blue-500/30"
      },
      {
        icon: BookOpen,
        title: "Instant Answer Review",
        description: "Get immediate access to correct answers after completing your quiz. Review correct answers to understand concepts and track your learning progress.",
        gradient: "from-purple-500/80 to-pink-500/80",
        ring: "ring-purple-500/30"
      }
    ],
    business: [
      {
        icon: Zap,
        title: "Lightning Speed",
        description: "Generate coding quizzes in minutes with AI, customized by difficulty and mix. Set up candidate assessments quickly.",
        gradient: "from-green-500/80 to-blue-500/80",
        ring: "ring-green-500/30"
      },
      {
        icon: CheckCircle,
        title: "Secure Proctoring",
        description: "Full-screen lockdown and auto-end on tab switches ensure fair evaluations. Set custom quiz durations to match your assessment needs.",
        gradient: "from-blue-500/80 to-purple-500/80",
        ring: "ring-blue-500/30"
      },
      {
        icon: BarChart3,
        title: "Smart Analytics",
        description: "Real-time graphs, comprehensive tables, and PDF/Excel exports. Make data-driven hiring decisions with actionable insights and detailed performance reports.",
        gradient: "from-purple-500/80 to-pink-500/80",
        ring: "ring-purple-500/30"
      },
      {
        icon: Share2,
        title: "Flexible & Secure Sharing",
        description: "Easily share assessments using secure links or direct invitations. Maintain full control with secret keys, attempt restrictions, and customizable time limits—ensuring a smooth and protected candidate experience.",
        gradient: "from-pink-500/80 to-orange-500/80",
        ring: "ring-pink-500/30"
      }
    ]
  };

  return (
    <section id="features" className="py-20 relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-l from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6">
            Features & 
            {/* Gradient text using Tailwind utility classes */}
            <span className="font-medium bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Benefits
            </span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-90 mb-8">
            Scalable capabilities tailored for individuals, small teams, and enterprises—powering AI-driven coding assessments with proctoring, analytics, and seamless sharing.
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

        <div className={`grid grid-cols-1 ${selectedUser === 'business' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-8 transition-all duration-500`}>
          {features[selectedUser].map((feature, index) => (
            <Card 
              key={index}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden"
            >
              <CardContent className="p-8 text-center relative">
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ${feature.ring} hover:animate-pulse`}>
                  <feature.icon className="w-8 h-8 text-white drop-shadow-sm" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm opacity-90 mx-auto">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
