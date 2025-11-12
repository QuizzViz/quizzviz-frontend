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
          {/* Replaced gradient-text with inline Tailwind */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 font-medium"> Questions?</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed opacity-90">
          Find answers to common queries about QuizzViz, from quiz generation to proctoring and analytics.
        </p>
      </div>
      
      <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="item-1">
        {/* The classes below are the Tailwind equivalent of the removed glassmorphism CSS */}
        <AccordionItem value="item-1" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">What is QuizzViz?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            QuizzViz is an AI-powered platform for generating secure, real-world scenario-based coding quizzes. For <strong>individuals</strong>, it provides instant practice sessions with immediate answer reviews to track learning progress. For <strong>businesses</strong>, it offers advanced hiring tools including secure sharing, smart analytics, and downloadable reports to filter the right candidates efficiently.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">How does proctoring work?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            Proctoring is available for <strong>both individuals and businesses</strong>. It enforces full-screen mode during quizzes. If anyone escapes full-screen or switches tabs, a modal appears prompting them to return or end the quiz. Unauthorized exits automatically end the session, ensuring fair and cheat-proof assessments whether you're practicing individually or evaluating candidates.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">Can I customize quizzes?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            <strong>Both plans</strong> let you select topics, difficulty levels (High School to PhD), question count, and the theory-to-code analysis ratio during quiz generation. However, <strong>only Business plan users</strong> can add, update, or remove individual questions after the quiz is generated, giving you complete control to fine-tune assessments for specific roles or requirements.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-4" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">How do I share quizzes with others?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            Quiz sharing is <strong>exclusively available for Business plan users</strong>. After generating a quiz, you can publish it and get the shareable link. Set a secret key to control access, configure custom duration and expiration dates, and define maximum attempts per candidate. Share the link with candidates who can then access and complete the quiz in proctored mode,perfect for remote screening.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-5" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">What analytics are available?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            <strong>Individuals</strong> can view  the correct answers after completing quizzes to track personal learning progress. <strong>Business users</strong> unlock powerful analytics including real-time performance graphs, comprehensive data tables with filtering options, and the ability to export results as PDF or Excel files. This enables you to rank candidates, compare performances, and make confident data-driven hiring decisions.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-6" className="rounded-2xl border-0 bg-white/5 backdrop-blur-xl border-white/10">
          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline focus:no-underline">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">Do you support enterprise solutions?</h3>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 text-sm text-muted-foreground leading-relaxed opacity-90">
            Currently, QuizzViz is designed for individuals and businesses. However, if you're an enterprise looking for a custom assessment solution with advanced features like team management, API integrations, and unlimited scale, we'd love to hear from you! Please reach out to us at <a href="mailto:syedshahmirsultan@gmail.com" className="text-blue-600 hover:underline transition-colors">syedshahmirsultan@gmail.com</a>  or  <a href="mailto:haidersultan0000000000@gmail.com
" className="text-blue-600 hover:underline">haidersultan0000000000@gmail.com
</a> and we can build a tailored solution for your organization.
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
