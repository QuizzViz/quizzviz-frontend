"use client";
import React, { FC } from "react";

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


type Step = {
  number: string;
  title?: string; 
  description: string;
  gradient: string;
  ring: string;
};

const HowItWorksSection: FC = () => {
  const steps = [
    {
      number: "1",
      title: "Create Assessment",
      description: "Select coding topics relevant to the role, choose difficulty level, and set the number of questions to match your job requirements.",
      gradient: "from-green-500/80 to-blue-500/80",
      ring: "ring-green-500/30"
    },
    {
      number: "2",
      title: "Share Securely",
      description: "Configure test settings including time limits and maximum attempts, then share the assessment link with candidates via email or your ATS.",
      gradient: "from-blue-500/80 to-purple-500/80",
      ring: "ring-blue-500/30"
    },
    {
      number: "3",
      title: "Analyze & Hire",
      description: "Review detailed performance metrics, compare candidates side-by-side, and download comprehensive reports to make confident hiring decisions.",
      gradient: "from-purple-500/80 to-pink-500/80",
      ring: "ring-purple-500/30"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
      {/* Subtle background elements for elegance */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2"></div>
        <div className="absolute bottom-1/3 right-1/2 w-96 h-96 bg-gradient-to-l from-purple-500/10 to-green-500/10 rounded-full blur-3xl transform translate-x-1/2"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-center">
            <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6">
              Streamline Your 
              <span className="font-medium ml-3 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Hiring Process
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Three simple steps to find and hire the best technical talent efficiently and effectively.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <Card 
              key={index}
              // Tailwind classes for glassmorphism and transition
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden"
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
    </section>
  );
};

export default HowItWorksSection;
