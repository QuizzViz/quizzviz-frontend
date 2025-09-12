import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, CheckCircle, BarChart3 } from "lucide-react";

// Features grid highlighting key benefits
export const FeaturesSection: FC = () => (
  <section id="features" className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
    <div className="absolute inset-0 opacity-10">
      <div
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')", backgroundSize: "cover", backgroundPosition: "center" }}
        className="w-full h-full"
      />
    </div>
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 scroll-fade visible">
        <h2 className="text-4xl lg:text-5xl font-light text-foreground mb-6">Features & <span className="gradient-text font-medium">Benefits</span></h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Enterprise-grade capabilities designed for modern hiring teams.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Lightning Speed</h3>
            <p className="text-muted-foreground">Generate assessments in minutes with AI.</p>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Precision Matching</h3>
            <p className="text-muted-foreground">Match candidates by proven skills.</p>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Smart Efficiency</h3>
            <p className="text-muted-foreground">Focus on qualified candidates only.</p>
          </CardContent>
        </Card>
        <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">Enterprise Scale</h3>
            <p className="text-muted-foreground">Secure and reliable at high volume.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);
