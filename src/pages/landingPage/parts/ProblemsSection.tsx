'use client';

import { FC } from "react";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, ChartNoAxesColumn,ChartColumn,ChartColumnDecreasing } from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "./motion";
import IconGlow from "./IconGlow";

const items = [
  {
    icon: Clock,
    label: "Speed",
    description:
      "Generate a role-specific assessment from a document or a tech stack in minutes, then publish it with a secret key and a time limit.",
  },
  {
    icon: ShieldCheck,
    label: "Integrity",
    description:
      "Candidates attempt the quiz full-screen. Switching tabs ends it immediately, minimizing shows a continue-or-end prompt, and a mobile device triggers a warning.",
  },
  {
    icon:ChartColumn,
    label: "Visibility",
    description:
      "Every attempt lands in your analytics dashboard. Filter by role, score, or date to see performance at a glance.",
  },
];

const ProblemsSection: FC = () => {
  return (
    <section className="relative bg-background py-20 lg:py-28">
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="max-w-2xl mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Screen for skill, <span className="gradient-text">not schedule</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Every assessment is generated from your own material, run under proctoring, and
            scored automatically. Here’s what changes for your hiring team.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="border-t border-white/10"
        >
          {items.map((item) => (
            <motion.div
              key={item.label}
              variants={fadeUp}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 border-b border-white/10"
            >
              <div className="md:col-span-4 flex items-center gap-3">
                <IconGlow
                  icon={item.icon}
                  size="w-7 h-7"
                  glowSize="w-12 h-12"
                  strokeWidth={1.75}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <h3 className="text-lg font-semibold text-white">{item.label}</h3>
              </div>
              <p className="md:col-span-8 text-gray-400 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemsSection;
