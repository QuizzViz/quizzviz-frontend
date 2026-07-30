'use client';

import { FC } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, ShieldCheck, BarChart3, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const trustPills = [
  { icon: Sparkles, label: "AI-generated questions" },
  { icon: ShieldCheck, label: "Proctored evaluation" },
  { icon: BarChart3, label: "Actionable insights" },
];

const pipelineSteps = [
  { icon: FileText, title: "Upload a Document", description: "Or generate from a tech stack instead." },
  { icon: Sparkles, title: "AI Builds the Assessment", description: "Role-specific questions, ready in minutes." },
  { icon: ShieldCheck, title: "Evaluate with Proctoring", description: "A protected link and key for every candidate." },
  { icon: BarChart3, title: "Decide with Confidence", description: "Compare candidates with actionable insights." },
];

const HeroSection: FC = () => {
  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative flex items-center justify-center min-h-screen overflow-hidden pt-8 sm:pt-10 md:pt-16 lg:pt-20 pb-16 sm:pb-20 scroll-mt-20 sm:scroll-mt-24 md:scroll-mt-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background" />
      <div aria-hidden className="absolute right-[-12%] top-10 w-[65vw] max-w-[980px] aspect-square rounded-[36%] bg-[radial-gradient(60%_60%_at_30%_30%,rgba(147,197,253,0.25),rgba(59,130,246,0.12)_45%,rgba(34,197,94,0.08)_75%,transparent_85%)] blur-3xl opacity-70" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-tight">
              Turn Any Document Into a{" "}
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Proctored AI Assessment
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Upload your documents, let AI create role-specific assessments, then evaluate candidates with proctoring and make better hiring decisions with actionable insights.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {trustPills.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-200"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link href="https://calendly.com/syedshahmirsultan/new-meeting">
                <Button className="group inline-flex px-8 py-6 items-center bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl text-base">
                  Book a Demo
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                onClick={scrollToDemo}
                variant="outline"
                className="inline-flex items-center px-8 py-6 bg-transparent border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-base"
              >
                <PlayCircle className="mr-2 w-4 h-4" />
                Watch How It Works
              </Button>
            </div>
          </div>

          {/* Pipeline overview: document-first, non-interactive by design */}
          <div className="w-full">
            <div className="bg-black/30 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
                {pipelineSteps.map((step, index) => (
                  <div key={step.title} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                    {index < pipelineSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-px bg-gradient-to-r from-white/20 to-transparent" />
                    )}
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/80 to-blue-500/80 shadow-md mb-4 relative z-10">
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </section>
  );
};

export default HeroSection;
