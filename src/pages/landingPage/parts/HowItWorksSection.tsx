'use client';

import { FC } from "react";
import { motion } from "framer-motion";
import { FileUp, Eye, BarChart3, CheckCircle2 } from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "./motion";

const steps = [
  {
    stepNumber: "01",
    icon: FileUp,
    badge: "Minutes, not hours",
    title: "Upload material and configure access",
    description:
      "Upload a document, such as a job description, an SOP, or a spec, or pick a tech stack. Set a secret key, a time limit, and an expiration date, then publish.",
    highlight: "Secret key, time limit, and expiry, set before you publish",
  },
  {
    stepNumber: "02",
    icon: Eye,
    badge: "Full-screen, proctored",
    title: "Candidates attempt it under proctoring",
    description:
      "They open the link, enter the secret key and their details, and start. The assessment runs full-screen, exiting shows a continue-or-end prompt, switching tabs ends the attempt immediately, and a mobile device triggers a warning.",
    highlight: "Tab-switch ends the attempt instantly",
  },
  {
    stepNumber: "03",
    icon: BarChart3,
    badge: "Filterable analytics",
    title: "Review results in your dashboard",
    description:
      "Graded scorecards and proctoring flags land on the analytics page. Filter by role, score, or date to shortlist fast.",
    highlight: "Every attempt, in one place",
  },
];

const HowItWorksSection: FC = () => {
  return (
    <section
      id="how-it-works"
      className="relative bg-background py-20 sm:py-24 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="max-w-2xl mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            From job spec to <span className="gradient-text">verified shortlist</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            No manual question writing, no thirty-minute screening calls with candidates who
            can’t demonstrate the skill on the page.
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            aria-hidden
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className="hidden md:block absolute left-[27px] top-3 bottom-3 w-px bg-gradient-to-b from-green-500 via-blue-500 to-purple-500"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col gap-10 md:gap-14"
          >
            {steps.map((step) => (
              <motion.div key={step.stepNumber} variants={fadeUp} className="relative flex flex-col md:flex-row gap-4 md:gap-8">
                <div className="flex md:w-14 shrink-0">
                  <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <step.icon className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1 md:pt-1">
                  <span className="inline-flex items-center text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 mb-3">
                    {step.badge}
                  </span>
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed mb-4 max-w-xl">{step.description}</p>
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>{step.highlight}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
