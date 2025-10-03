"use client";

import { FC } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown, Sparkles } from "lucide-react";

// FAQs section with accordion
const FAQsSection: FC = () => (
  <section id="faqs" className="py-20 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
    {/* Subtle background elements for elegance */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/2 right-0 w-96 h-96 bg-gradient-to-l from-purple-500/5 to-green-500/5 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 scroll-fade visible animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md border border-green-500/30 text-white text-sm font-medium mb-6 shadow-md">
          <Sparkles className="w-4 h-4 text-green-300" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-blue-300">Frequently Asked Questions</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-4 bg-clip-text">
          Got <span className="gradient-text font-medium">Questions?</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed opacity-90">
          Find answers to common queries about QuizzViz, from quiz generation to proctoring and pricing.
        </p>
      </div>
      
      <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="item-1">
        <AccordionItem value="item-1" className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">What is QuizzViz?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            QuizzViz is an AI-powered platform for generating secyure, real world scenario's based  coding quizzes. It helps individuals practice and evaluate their skillset, small businesses filter the right candidates, and enterprises scale their hiring and assessment process with real-time analytics and exports.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2" className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">How does proctoring work?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            Proctoring enforces a full-screen mode during quizzes. If users escape full-screen or switch tabs, a modal prompts them to return or end the quiz. Unauthorized exits auto-end the session, ensuring fair, cheat-proof assessments.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3" className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">Can I customize quizzes?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            Yes! Select topics, difficulty levels (High School to PhD level), question count, and coding/theory mix. AI generates real-world scenarios tailored for your needs—perfect for personal practice or professional hiring.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4" className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">How do I share quizzes with others?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            After generating, publish quizzes with a secure link and secret key. Set duration, expiration, and max attempts. Candidates access via link, enter the key, and complete in proctored mode—ideal for remote screening.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5" className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">What analytics are available?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            View real-time graphs, tables, and scores. Export filtered or full data as PDF/Excel. Individuals track progress; businesses rank hires; enterprises get team dashboards for scalable insights.
          </AccordionContent>
        </AccordionItem>
        
        {/* <AccordionItem value="item-6" className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">What are your pricing plans?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Consumer ($2.99/mo):</strong> Unlimited personal quizzes, proctoring, basic tracking (max 5 stored).</li>
              <li><strong>Business ($99/mo):</strong> Sharing, analytics, exports (up to 100 assessments/mo).</li>
              <li><strong>Enterprise:</strong> Custom pricing—unlimited scale, team roles, API integrations.</li>
            </ul>
            Start with a free trial—no card required.
          </AccordionContent>
        </AccordionItem> */}
      </Accordion>
      
      {/* CTA */}
      <div className="text-center mt-12 pt-8 border-t border-white/10">
        <p className="text-muted-foreground mb-6 text-sm opacity-80">Still have questions?</p>
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg">
          Contact Us
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
    <style jsx>{`
      .glassmorphism {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .animate-fade-in {
        animation: fadeIn 1s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .scroll-fade {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
      }
      .scroll-fade.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `}</style>
  </section>
);

export default FAQsSection;