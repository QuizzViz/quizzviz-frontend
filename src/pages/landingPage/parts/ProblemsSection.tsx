import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Zap } from "lucide-react";

// Three-card section describing core problems solved
export const ProblemsSection: FC = () => (
  <section id="problems" className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 scroll-fade visible">
        <h2 className="text-4xl lg:text-5xl font-light text-foreground mb-6">Problems We <span className="gradient-text font-medium">Solve</span></h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Transform your hiring process with intelligent solutions that save time and identify the right talent.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Speed</h3>
            <p className="text-muted-foreground leading-relaxed">Make real-world quizzes in minutes, not weeks.</p>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Accuracy</h3>
            <p className="text-muted-foreground leading-relaxed">Filter candidates by actual skills for fair, relevant assessments.</p>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Efficiency</h3>
            <p className="text-muted-foreground leading-relaxed">Avoid interviews with the wrong candidates via precise matching.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);
