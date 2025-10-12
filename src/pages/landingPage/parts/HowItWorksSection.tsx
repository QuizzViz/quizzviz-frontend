'use client';

import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Briefcase } from "lucide-react";
import { useUserType } from "@/contexts/UserTypeContext";

type UserType = 'individual' | 'business';

type Step = {
  number: string;
  title?: string; // Make title optional
  description: string;
  gradient: string;
  ring: string;
};

const HowItWorksSection: FC = () => {
  const { userType: selectedUser, setUserType: setSelectedUser } = useUserType();

  const steps: Record<UserType, Step[]> = {
    individual: [
      {
        number: "1",
        title: "Create Quiz",
        description: "Select your coding topic, choose difficulty level, set number of questions, and adjust the theory-to-code analysis ratio to create a personalized practice quiz.",
        gradient: "from-green-500/80 to-blue-500/80",
        ring: "ring-green-500/30"
      },
      {
        number: "2",
        title: "Take Assessment",
        description: "Practice in distraction-free full-screen mode with custom time limits. Auto-end on tab switches keeps you focused throughout the quiz.",
        gradient: "from-blue-500/80 to-purple-500/80",
        ring: "ring-blue-500/30"
      },
      {
        number: "3",
        title: "Review & Learn",
        description: "View Correct answers to identify your strengths and weaknesses. Track your progress and improve your skills.",
        gradient: "from-purple-500/80 to-green-500/80",
        ring: "ring-purple-500/30"
      }
    ],
    business: [
      {
        number: "1",
        title: "Create Assessment",
        description: "Select coding topics relevant to the role, choose difficulty level, set number of questions, and balance theory-to-code analysis questions to match job requirements.",
        gradient: "from-green-500/80 to-blue-500/80",
        ring: "ring-green-500/30"
      },
      {
        number: "2",
        title: "Share Securely",
        description: "Set a secret key, maximum attempts, custom duration, and share it with the candidates you want to attempt the quiz.",
        gradient: "from-blue-500/80 to-purple-500/80",
        ring: "ring-blue-500/30"
      },
      {
        number: "3",
        title: "Analyze & Hire",
        description: "View real-time performance graphs, filter candidates in comprehensive tables, download PDF/Excel reports, and make confident data-driven hiring decisions.",
        gradient: "from-purple-500/80 to-pink-500/80",
        ring: "ring-purple-500/30"
      }
    ]
  };

  return (
    <section id="how-it-works" className="py-20 relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
      {/* Subtle background elements for elegance */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2"></div>
        <div className="absolute bottom-1/3 right-1/2 w-96 h-96 bg-gradient-to-l from-purple-500/10 to-green-500/10 rounded-full blur-3xl transform translate-x-1/2"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 scroll-fade visible animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6 bg-clip-text">
            How It <span className="gradient-text font-medium">Works</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-90 mb-8">
            Three simple steps to revolutionize your coding assessments—whether building personal skills and hiring the right candidates.
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {steps[selectedUser].map((step: any, index: any) => (
            <Card 
              key={index}
              className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden"
            >
              <CardContent className="p-8 text-center relative">
                <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ${step.ring} hover:animate-bounce`}>
                  <span className="text-3xl font-bold text-white drop-shadow-sm">{step.number}</span>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm opacity-90 mx-auto">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <style jsx>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .gradient-text {
          background: linear-gradient(to right, rgb(34, 197, 94), rgb(59, 130, 246));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scroll-fade {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease-out;
        }
        .scroll-fade.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
};

export default HowItWorksSection;