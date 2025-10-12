import { FC } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

// Final call-to-action with two buttons (start trial / book demo)
const CTASection: FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section id="cta" className="py-24 bg-gradient-to-r from-gray-900/30 to-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
      {/* Subtle background elements for elegance */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/2 right-0 w-96 h-96 bg-gradient-to-l from-purple-500/10 to-green-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="scroll-fade visible animate-fade-in">
          {/* Trust badge */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md border border-green-500/30 text-white text-sm font-medium mb-6 shadow-md mx-auto">
            <Sparkles className="w-4 h-4 text-green-300" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-blue-300">Trusted by Developers, Teams & Enterprises</span>
          </div> */}
          <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6 leading-tight">
            Ready to Transform Your <span className="gradient-text font-medium">Assessments?</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed opacity-90">
            Join individuals and startups using QuizzViz to build skills, screen talent, and scale hiring faster with AI-powered coding quizzes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => scrollTo("signup")} 
              className="group inline-flex items-center px-10 py-6 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg relative overflow-hidden"
            >
              <span className="relative z-10">Start Free Trial</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-300"></div>
            </Button>
            <Link href="https://calendly.com/syedshahmirsultan/new-meeting"><Button 
              variant="outline" 
              className="inline-flex items-center px-10 py-6 bg-transparent border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg text-lg backdrop-blur-sm"
            >
              Book a Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button></Link>
          </div>
        </div>
      </div>
      <style jsx>{`
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
};

export default CTASection;