import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, CheckCircle, BarChart3, Shield } from "lucide-react";

// Features grid highlighting key benefits
const FeaturesSection: FC = () => (
  <section id="features" className="py-20 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 overflow-hidden">
    {/* Subtle background elements for elegance */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-l from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 scroll-fade visible animate-fade-in">
        <h2 className="text-4xl lg:text-5xl font-light tracking-wide text-foreground mb-6 bg-clip-text">
          Features & <span className="gradient-text font-medium">Benefits</span>
        </h2>
        <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed opacity-90">
          Scalable capabilities tailored for individuals, small teams, and enterprises—powering AI-driven coding assessments with proctoring, analytics, and seamless sharing.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/80 to-blue-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-green-500/30 hover:animate-pulse">
              <Zap className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Lightning Speed</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Generate coding quizzes in minutes with AI, customized by difficulty and mix.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Individuals: Instant practice</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Businesses: Quick setups</span>
              </li>
              {/* <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Enterprises: Bulk generation</span>
              </li> */}
            </ul>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-blue-500/30 hover:animate-pulse">
              <CheckCircle className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Secure Proctoring</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Full-screen lockdown, auto-end on tab switches, and instant answer reviews.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Individuals: Focused practice</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Businesses: Fair evaluations</span>
              </li>
              {/* <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Enterprises: Compliant testing</span>
              </li> */}
            </ul>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/80 to-pink-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-purple-500/30 hover:animate-pulse">
              <BarChart3 className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Smart Analytics</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Real-time graphs, tables, and PDF/Excel exports for actionable insights.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Individuals: Progress tracking</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Businesses: Hiring reports</span>
              </li>
              {/* <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Enterprises: Team dashboards</span>
              </li> */}
            </ul>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl border-0 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 scroll-fade visible border-white/10 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            {/* Icon with subtle glow */}
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500/80 to-green-500/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-pink-500/30 hover:animate-pulse">
              <Shield className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Flexible Sharing</h3>
            <p className="text-muted-foreground leading-relaxed mb-5 text-sm opacity-90 max-w-sm mx-auto">
              Publish with links, secret keys, durations, and attempt limits for secure distribution.
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left mx-auto max-w-xs list-none">
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>Individuals: Self-sharing</span>
              </li>
              <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>Businesses: Candidate invites</span>
              </li>
              {/* <li className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>Enterprises: Team workflows</span>
              </li> */}
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

export default FeaturesSection;