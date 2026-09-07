'use client';

import { FC } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, viewportOnce, brand } from "./motion";

const CTASection: FC = () => {
  return (
    <section
      id="cta"
      className="relative bg-background py-20 sm:py-24 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="border-t border-white/10 pt-14 sm:pt-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="max-w-xl"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
              Screen your next candidate <span className="gradient-text">today</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              QuizzViz turns your documents or tech stack into a proctored assessment,
              published with a secret key and a time limit, and shared with one link.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col sm:flex-row gap-4 shrink-0"
          >
            <Link
              href="/pricing"
              className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-transform duration-200 hover:scale-[1.03] ${brand.ring}`}
            >
              <span className="relative z-10">Start free trial</span>
              <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
            </Link>
            <Link
              href="https://calendly.com/syedshahmirsultan/new-meeting"
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-white/10 hover:border-white/40 ${brand.ring}`}
            >
              Book a demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
