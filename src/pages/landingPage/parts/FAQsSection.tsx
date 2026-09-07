'use client';

import { FC } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { fadeIn, viewportOnce, brand } from "./motion";

const faqs = [
  {
    value: "item-1",
    q: "What is QuizzViz?",
    a: "QuizzViz is a pre-screening assessment platform that turns your own documents, or a tech stack, into AI-generated quizzes for any role, technical or non-technical. By automatically filtering out unqualified candidates, it saves valuable interview time by ensuring only the most competent candidates progress to the interview stage.",
  },
  {
    value: "item-2",
    q: "How does document-based quiz generation work?",
    a: "Upload a document relevant to the role, such as a job description, training manual, policy document, or technical specification, and QuizzViz’s AI reads its content and drafts role-specific questions directly from it. Set the experience level and number of questions, review and adjust anything you’d like, then publish and share the assessment.",
  },
  {
    value: "item-3",
    q: "Can I generate a quiz for any role, not just technical ones?",
    a: "Yes. QuizzViz isn’t limited to coding roles. Upload a document for any position, including Sales, Marketing, HR, Finance, or Operations, and the AI generates a quiz tailored to it. For technical roles, a tech stack works just as well as a document.",
  },
  {
    value: "item-4",
    q: "How does proctoring work?",
    a: "Once a candidate starts, the assessment opens full-screen and QuizzViz watches activity in real time, warning on signs like a face moving out of frame or a phone coming into view. Minimizing or leaving full-screen brings up a prompt to continue or end the quiz: continuing returns to full-screen, ending goes straight to the results page. Switching tabs ends the attempt immediately.",
  },
  {
    value: "item-5",
    q: "How do I share a quiz with candidates?",
    a: "Set a secret key, a time limit, and an expiration date, then publish to generate a shareable link. Share the link and key with candidates: they open the link, enter the key and their details, and start.",
  },
  {
    value: "item-6",
    q: "What analytics are available?",
    a: "Interactive performance graphs and score distributions, top-performing candidates, a detailed table of all candidates with emails and scores, advanced filtering, and export to PDF or Excel.",
  },
  {
    value: "item-7",
    q: "Can I add my team to QuizzViz?",
    a: "Yes. Invite teammates to your workspace and assign them roles. Each member’s permissions follow their role, so your team can work through hiring together instead of sharing one login.",
  },
];

const FAQsSection: FC = () => (
  <section id="faqs" className="relative bg-background py-20 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
    <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mb-12"
      >
        <p className="text-sm font-semibold text-blue-400 mb-4">FAQ</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          Common <span className="gradient-text">questions</span>
        </h2>
        <p className="text-lg text-gray-400 leading-relaxed">
          Answers to common questions about QuizzViz’s hiring assessment platform.
        </p>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" whileInView="show" viewport={viewportOnce}>
        <Accordion type="single" collapsible className="w-full border-t border-white/10" defaultValue="item-1">
          {faqs.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value} className="border-b border-white/10">
              <AccordionTrigger className="py-5 text-left hover:no-underline">
                <h3 className="text-white font-semibold">{faq.q}</h3>
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm leading-relaxed pb-2">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <p className="text-gray-400 text-sm">Still have questions?</p>
        <Link
          href="/contact"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium hover:brightness-110 transition-all duration-300 shadow-md w-fit ${brand.ring}`}
        >
          Contact us
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default FAQsSection;
