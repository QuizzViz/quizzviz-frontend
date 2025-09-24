import { FC } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import HeroLogoSVG from "@/components/HeroLogoSVG";

// Top hero section: headline, CTA, animated logo
const HeroSection: FC = () => {
  const { user } = useUser();
  return (
    <section id="hero" className="relative overflow-hidden pt-10 sm:pt-14 md:pt-24 pb-8 md:min-h-screen scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background" />
      <div aria-hidden className="absolute right-[-12%] top-10 w-[65vw] max-w-[980px] aspect-square rounded-[36%] bg-[radial-gradient(60%_60%_at_30%_30%,rgba(147,197,253,0.25),rgba(59,130,246,0.12)_45%,rgba(34,197,94,0.08)_75%,transparent_85%)] blur-3xl opacity-70" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-start md:items-center md:min-h-[calc(100vh-8rem)] py-1">
          <div className="text-center md:text-left order-1">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-light tracking-[-0.02em] text-foreground mb-3 leading-[1.08]">
                Transform Hiring <span className="ml-3">with</span>
                <br />
                <span className="gradient-text font-medium ml-3">Intelligent Assessments</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground/90 text-gray-200 mb-3 leading-relaxed">
                Hire Smarter, Faster.
              </p>
              <p className="text-md text-muted-foreground/90 text-gray-200 mb-6 leading-relaxed">
                Create enterprise-grade technical quizzes in minutes and filter the right candidates instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                {user ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-4 md:px-6 py-2 md:py-4 bg-white text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 text-base md:text-sm ring-1 ring-black/10 hover:ring-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:translate-x-2 duration-150">
                      Get Started <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-4 md:px-6 py-2 md:py-4 bg-white text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 text-base md:text-sm ring-1 ring-black/10 hover:ring-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:translate-x-2 duration-150">
                      Get Started <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                  </Link>
                )}
                <Button variant="outline" className="md:ml-2 inline-flex items-center rounded-xl px-4 md:px-6 py-2 md:py-4 bg-transparent border border-white/70 text-white hover:bg-white/10 hover:border-white transition-all duration-300 text-base md:text-sm">
                  Book a Demo
                </Button>
              </div>
            </div>
          </div>
          <div className="hidden md:flex order-2 md:order-2 justify-center md:justify-end" aria-hidden="true">
            <div className="w-full md:w-[min(88vh,1100px)] lg:w-[min(92vh,1400px)] aspect-square md:aspect-auto md:h-[min(88vh,1100px)] lg:h-[min(92vh,1400px)]">
              <HeroLogoSVG size="100%" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;