'use client';

import { FC } from "react";
import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "./motion";

const DemoSection: FC = () => (
  <section id="demo" className="relative bg-background py-16 sm:py-20 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
    <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="max-w-2xl mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          See the full <span className="gradient-text">pipeline</span>, end to end
        </h2>
        <p className="text-gray-400 leading-relaxed">
          From uploading a document to reviewing a proctored scorecard, the whole flow in
          one recording.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-black"
      >
        <div aria-hidden className="h-[2px] w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
        <div className="aspect-video">
          <iframe
            src="https://www.youtube.com/embed/q-m5PZXD5Gs"
            title="QuizzViz demo"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full h-full"
          />
        </div>
      </motion.div>
    </div>
  </section>
);

export default DemoSection;
