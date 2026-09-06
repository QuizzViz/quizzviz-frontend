"use client";

import React, { FC } from "react";
import { UploadCloud, ShieldAlert, CheckCircle2, ArrowRight, Layers, FileCheck, Laptop, Trophy } from "lucide-react";

const steps = [
  {
    stepNumber: "01",
    icon: UploadCloud,
    badge: "1-Minute Setup",
    title: "Upload Your Material or Pick a Stack",
    description:
      "Drop in any PDF (job description, internal SOPs, product documentation) or select your stack (Python, React, Go, SQL, Sales). Set question count and difficulty in seconds.",
    highlight: "No question-writing burnout",
    accentColor: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    numberColor: "text-emerald-400",
  },
  {
    stepNumber: "02",
    icon: Laptop,
    badge: "Anti-Cheat Lockdown",
    title: "Dispatch Secure Proctored Links",
    description:
      "Send candidates a unique assessment link with an expiring passkey. Tests launch in-browser with automated webcam monitoring, full-screen lockdown, and tab-switch detection.",
    highlight: "Zero software downloads for candidates",
    accentColor: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    numberColor: "text-blue-400",
  },
  {
    stepNumber: "03",
    icon: Trophy,
    badge: "Instant Decision",
    title: "Review Verified Talent & Hire",
    description:
      "Review auto-graded scorecards, question-by-question response speeds, and proctoring incident flags. Fast-track proven performers directly to final rounds.",
    highlight: "Cut screening calls by 75%",
    accentColor: "from-purple-500/20 to-pink-500/10",
    iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    numberColor: "text-purple-400",
  },
];

const HowItWorksSection: FC = () => {
  return (
    <section id="how-it-works" className="py-24 relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden bg-background">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-5">
            <Layers className="w-3.5 h-3.5" />
            Simple 3-Step Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            From job spec to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              verified shortlist
            </span>{" "}
            in minutes.
          </h2>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Eliminate manual question writing and stop booking 30-minute introductory phone calls with candidates who can't demonstrate real job skills.
          </p>
        </div>

        {/* 3-Step Process Grid with Connecting Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.stepNumber}
                className="relative group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-1"
              >
                {/* Subtle top gradient */}
                <div
                  className={`absolute inset-x-0 top-0 h-28 rounded-t-2xl bg-gradient-to-b ${step.accentColor} opacity-30 pointer-events-none`}
                />

                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${step.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {step.badge}
                      </span>
                    </div>
                    <span className={`text-2xl font-mono font-bold ${step.numberColor} opacity-60`}>
                      {step.stepNumber}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Highlight Tag */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{step.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
