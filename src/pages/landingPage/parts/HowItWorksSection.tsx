import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Three-step "How it works" walkthrough
const HowItWorksSection: FC = () => (
  <section id="how-it-works" className="py-20 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
    {/* Subtle background elements for elegance */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2"></div>
      <div className="absolute bottom-1/3 right-1/2 w-96 h-96 bg-gradient-to-l from-purple-500/10 to-green-500/10 rounded-full blur-3xl transform translate-x-1/2"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 scroll-fade visible animate-fade-in">
        <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6 bg-clip-text">
          How It <span className="gradient-text font-medium">Works</span>
        </h2>
        <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-90">
          Three simple steps to revolutionize your coding assessments—whether building personal skills, screening candidates, or scaling enterprise hiring.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/80 to-blue-500/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-green-500/30 hover:animate-bounce">
              <span className="text-3xl font-bold text-white drop-shadow-sm">1</span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Generate Quiz</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Input requirements and AI creates tailored coding quizzes with real-world scenarios.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Individuals: Custom practice</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Businesses: Role-specific tests</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Enterprises: Bulk customization</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-blue-500/30 hover:animate-bounce">
              <span className="text-3xl font-bold text-white drop-shadow-sm">2</span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Assess Securely</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Share via links/keys or proctor in full-screen mode with auto-end safeguards.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Individuals: Distraction-free focus</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Businesses: Easy candidate invites</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Enterprises: Secure team distribution</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/80 to-green-500/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-purple-500/30 hover:animate-bounce">
              <span className="text-3xl font-bold text-white drop-shadow-sm">3</span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Analyze & Decide</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Get instant results, feedback, graphs, and exports for informed progress or hiring.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Individuals: Skill insights</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Businesses: Hiring rankings</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Enterprises: Advanced reporting</span>
              </li>
            </ul>
          </CardContent>
        </Card>
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

export default HowItWorksSection;