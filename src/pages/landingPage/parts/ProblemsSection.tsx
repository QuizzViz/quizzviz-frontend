'use client';

import React, { FC } from "react";
import { Clock, CheckCircle, Zap } from "lucide-react";

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
  const content = {
    speed: "Generate technical assessments in minutes that test real-world coding skills through scenario-based questions. Screen candidates faster and more effectively than ever before.",
    accuracy: "Ensure fair and accurate evaluations with our proctored assessments. Advanced monitoring and auto-detection of suspicious activities maintain the integrity of your hiring process.",
    efficiency: "Streamline your hiring with powerful analytics. Compare candidates side-by-side, view detailed performance metrics, and make data-driven hiring decisions with confidence."
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
          <div className="text-center">
            <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6 bg-clip-text">
              Transform Your 
              <span className="font-medium ml-3 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Hiring Process
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-90">
              Our AI-powered platform helps you identify top technical talent efficiently with automated coding assessments, proctored evaluations, and detailed analytics to make data-driven hiring decisions.
            </p>
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
                {content.speed}
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
                {content.accuracy}
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
                {content.efficiency}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
