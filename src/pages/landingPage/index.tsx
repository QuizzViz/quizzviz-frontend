import  HeroSection  from "./parts/HeroSection";
import DemoSection  from "./parts/DemoSection";
import ProblemsSection  from "./parts/ProblemsSection";
import FeaturesSection  from "./parts/FeaturesSection";
import  HowItWorksSection  from "./parts/HowItWorksSection";
import CTASection  from "./parts/CTASection";
import  useScrollFade  from "./hooks/useScrollFade";
import { Navbar } from "@/components/NavBar";

// Landing page entry: compose all sections and init scroll animations
export default function LandingPage() {
  useScrollFade();
  return (
    <div className="min-h-screen mt-24 md:mt-0">
      <Navbar />
      <HeroSection />
      <DemoSection />
      <ProblemsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}
