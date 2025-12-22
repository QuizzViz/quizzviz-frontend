"use client"
import React, { FC } from "react";
import { Zap, CheckCircle, BarChart3, Share2 } from "lucide-react";





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
  const features = [
    {
      icon: Zap,
      title: "Enterprise-Grade Assessments",
      description: "Create customized coding tests tailored to your company's tech stack and role requirements. Our AI-powered platform generates relevant challenges in minutes, saving your hiring team countless hours.",
      gradient: "from-green-500/80 to-blue-500/80",
      ring: "ring-green-500/30"
    },
    {
      icon: CheckCircle,
      title: "Secure & Simple Access",
      description: "Easily control who takes your quizzes. Share a secure link and secret key with candidates - that's all they need to start their assessment.",
      gradient: "from-blue-500/80 to-purple-500/80",
      ring: "ring-blue-500/30"
    },
    {
      icon: BarChart3,
      title: "Hiring Analytics",
      description: "Make data-driven hiring decisions with our advanced analytics. Track candidate performance, identify skill gaps, and optimize your recruitment funnel.",
      gradient: "from-purple-500/80 to-pink-500/80",
      ring: "ring-purple-500/30"
    }
  ];

  return (
    <section id="features" className="py-20 relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-l from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-center">
            <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6">
              Enterprise-Grade 
              <span className="font-medium ml-3 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Hiring Platform
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Designed exclusively for companies to identify top technical talent efficiently and securely. Scale your hiring without compromising on quality or security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
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
