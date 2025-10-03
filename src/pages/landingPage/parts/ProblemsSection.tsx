import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Zap } from "lucide-react";

// Three-card section describing core problems solved
const ProblemsSection: FC = () => (
  <section id="problems" className="py-20 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
    {/* Subtle background elements for elegance */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/2 right-1/4 w-96 h-96 bg-gradient-to-l from-purple-500/10 to-green-500/10 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 scroll-fade visible animate-fade-in">
        <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6 bg-clip-text">
          Problems We <span className="gradient-text font-medium">Solve</span>
        </h2>
        <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-90">
          From personal skill-building to enterprise hiring, transform your coding assessments with AI-powered solutions that save time, ensure fairness, and deliver real insights.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/80 to-blue-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-green-500/30 hover:animate-pulse">
              <Clock className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Speed</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Generate coding quizzes in minutes that test real-world concepts with AI.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Individuals: Quick practice sessions</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Businesses: Fast candidate screening</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Enterprises: Rapid assessment rollout</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-blue-500/30 hover:animate-pulse">
              <CheckCircle className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Accuracy</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Secure proctored mode with full-screen lockdown and auto-end on distractions for fair, reliable results.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Individuals: Honest self-evaluation</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Businesses: Cheat-proof hiring</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Enterprises: Compliant skill validation</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/80 to-green-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-purple-500/30 hover:animate-pulse">
              <Zap className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Efficiency</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Instant feedback, detailed analytics, and exports to track progress or make confident decisions.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Individuals: Personalized growth insights</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Businesses: Actionable hiring data</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Enterprises: Scalable team reporting</span>
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

export default ProblemsSection;