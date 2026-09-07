'use client';

import { FC, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileUp, KeyRound, Eye, BarChart3, PlayCircle } from "lucide-react";
import { fadeUp, stagger, brand } from "./motion";

const trustPills = [
  { icon: FileUp, label: "Generated from your material" },
  { icon: Eye, label: "Full-screen proctoring" },
  { icon: BarChart3, label: "Filterable analytics" },
];

const pipelineSteps = [
  { icon: FileUp, step: "01", title: "Upload material", description: "Give QuizzViz a document or a tech stack, and it drafts role-specific questions from it." },
  { icon: KeyRound, step: "02", title: "Set access and publish", description: "Add a secret key, a time limit, and an expiration date, then publish and share the link." },
  { icon: Eye, step: "03", title: "Proctored assessment", description: "Candidates enter the secret key and their details, then start in full-screen. QuizzViz watches in real time: it warns when a face moves out of frame or a phone comes into view, and ends the attempt the moment a tab is switched." },
  { icon: BarChart3, step: "04", title: "Review results", description: "Every attempt lands in your analytics dashboard, filterable by score. Open any candidate to see their performance metrics in detail." },
];

const HeroSection: FC = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % pipelineSteps.length), 3200);
    return () => clearInterval(id);
  }, [paused, prefersReducedMotion]);

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-background pt-24 sm:pt-28 md:pt-32 pb-20 sm:pb-24 scroll-mt-20 sm:scroll-mt-24 md:scroll-mt-28"
    >
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 lg:px-8"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left: statement, left-biased, no centring */}
          <div className="lg:col-span-6">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-blue-400 mb-5">
              AI hiring assessments
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-white mb-6"
            >
              Turn any document into a{" "}
              <span className="gradient-text">proctored AI assessment</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">
              Upload a document or pick a tech stack and QuizzViz drafts the questions.
              Publish with a secret key and a time limit, then review graded, proctored results.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                href="https://calendly.com/syedshahmirsultan/new-meeting"
                className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-blue-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-transform duration-200 hover:scale-[1.03] ${brand.ring}`}
              >
                <span className="relative z-10">Book a demo</span>
                <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
              </Link>
              <button
                onClick={scrollToDemo}
                className={`inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-base font-semibold text-white transition-colors duration-200 hover:bg-white/10 hover:border-white/30 ${brand.ring}`}
              >
                <PlayCircle className="w-4 h-4" />
                Watch the demo
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {trustPills.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-sm text-gray-400">
                  <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: the live product, not a decorative blob */}
          <motion.div
            variants={fadeUp}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="lg:col-span-6 relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
          >
            <div aria-hidden className="h-[2px] w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
            <div className="divide-y divide-white/10">
              {pipelineSteps.map((step, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={step.step}
                    onClick={() => setActive(i)}
                    aria-pressed={isActive}
                    className={`relative w-full text-left flex items-start gap-4 p-5 sm:p-6 transition-colors duration-300 ${brand.ring} ${
                      isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="pipeline-indicator"
                        aria-hidden
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 to-blue-500"
                        transition={{ type: "spring", stiffness: 350, damping: 32 }}
                      />
                    )}
                    <div
                      className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors duration-300 ${
                        isActive ? "border-white/25 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <step.icon
                        className={`w-4 h-4 transition-colors duration-300 ${isActive ? "text-white" : "text-gray-500"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm">{step.title}</h3>
                        <span className="text-xs font-mono text-gray-500 shrink-0">{step.step}</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
