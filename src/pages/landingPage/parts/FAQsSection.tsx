import { FC } from "react";
// Accordion components are assumed to be Client Components internally (they handle clicks/state)
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; 
import { ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";

// FAQs section with accordion
// This is now a Server Component
const FAQsSection: FC = () => (
  <section id="faqs" className="py-20 relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
    {/* Subtle background elements for elegance */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/2 right-0 w-96 h-96 bg-gradient-to-l from-purple-500/5 to-green-500/5 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Removed custom animation classes */}
      <div className="text-center mb-12"> 
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md border border-green-500/30 text-white text-sm font-medium mb-6 shadow-md">
          <Sparkles className="w-4 h-4 text-green-300" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-blue-300">Frequently Asked Questions</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-4 bg-clip-text">
          Got 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 font-medium"> Questions?</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed opacity-90">
          Find answers to common queries about QuizzViz's hiring assessment platform.
        </p>
      </div>
      
      <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="item-1">
        <AccordionItem value="item-1" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">What is QuizzViz ?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            QuizzViz is a pre-screening technical assessment platform that helps companies efficiently evaluate candidates through coding quizzes. By automatically filtering out unqualified candidates, it saves valuable interview time by ensuring only the most competent candidates progress to the interview stage. It's designed specifically for hiring teams to assess technical skills quickly and effectively.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">How does proctoring work?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            Our proctoring system automatically terminates the quiz if the candidate switches tabs or windows during the assessment. This ensures test integrity by preventing candidates from looking up answers.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">How do I share a quiz with candidates?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            Simply generate a shareable link and a secret key for your quiz. Share both with candidates, who can then access and attempt the assessment.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">What analytics are available?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            The comprehensive analytics dashboard provides:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Interactive performance graphs and score distributions</li>
              <li>Top performing candidates with highest scores</li>
              <li>Detailed table of all candidates including emails and scores</li>
              <li>Advanced filtering options to sort and analyze candidate results</li>
              <li>Export functionality to download candidate data in:
                <ul className="list-[circle] pl-5 mt-1 space-y-1">
                  <li>PDF format for reports</li>
                  <li>Excel format for further analysis</li>
                </ul>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* CTA */}
      <div className="text-center mt-12 pt-8 border-t border-white/10">
        <p className="text-muted-foreground mb-6 text-sm opacity-80">Still have questions?</p>
        <Link href="/contact"><button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg">
          Contact Us
          <ChevronDown className="w-4 h-4" />
        </button></Link>
      </div>
    </div>
  </section>
);

export default FAQsSection;
