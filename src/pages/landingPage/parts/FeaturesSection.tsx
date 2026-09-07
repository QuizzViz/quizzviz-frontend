'use client';

import { FC } from "react";
import { motion } from "framer-motion";
import { FileStack, KeyRound, LineChart, Users } from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "./motion";

const lead = {
  icon: FileStack,
  title: "Enterprise-grade assessments",
  description:
    "Turn your own documents, or your company’s tech stack, into assessments tailored to any role, technical or non-technical. QuizzViz drafts the questions in minutes, so your hiring team doesn’t write them by hand.",
};

const support = [
  {
    icon: KeyRound,
    title: "Proctored, simple access",
    description:
      "Candidates open the link, enter the secret key and their details, and start. No account required.",
  },
  {
    icon: LineChart,
    title: "Hiring analytics",
    description:
      "Every attempt appears in your analytics dashboard, filterable by role, score, and date, with performance metrics for each candidate.",
  },
  {
    icon: Users,
    title: "Team roles and permissions",
    description:
      "Add teammates to your workspace and assign roles. Each member’s permissions follow their role, so your team can work through hiring together.",
  },
];

const FeaturesSection: FC = () => {
  return (
    <section id="features" className="relative bg-background py-20 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="max-w-2xl mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            A platform built to <span className="gradient-text">scale hiring</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Purpose-built for teams that need to screen more candidates without lowering the bar.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 lg:grid-cols-5 gap-5"
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="w-14 h-14 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center mb-6">
              <lead.icon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">{lead.title}</h3>
            <p className="text-gray-400 leading-relaxed max-w-md">{lead.description}</p>
          </motion.div>

          <div className="lg:col-span-2 flex flex-col gap-5">
            {support.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
