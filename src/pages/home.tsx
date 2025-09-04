import { useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Zap, BarChart3, ArrowRight } from "lucide-react";
import { HeroLogoSVG } from "@/components/HeroLogoSVG";

export default function Home() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Set up intersection observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
        }
      });
    }, observerOptions);

    // Observe all scroll-fade elements
    document.querySelectorAll(".scroll-fade").forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero Section (Left-Right layout) */}
      <section 
        id="hero" 
        className="min-h-screen relative overflow-hidden pt-12 sm:pt-18 md:pt-28 pb-4 scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
        data-testid="hero-section"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background"></div>
        {/* Soft gradient glow to the right for elegance */}
        <div
          aria-hidden="true"
          className="absolute right-[-12%] top-10 w-[65vw] max-w-[980px] aspect-square rounded-[36%] 
                     bg-[radial-gradient(60%_60%_at_30%_30%,rgba(147,197,253,0.25),rgba(59,130,246,0.12)_45%,rgba(34,197,94,0.08)_75%,transparent_85%)] 
                     blur-3xl opacity-70 pointer-events-none"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-start md:items-center min-h-[calc(100vh-10rem)] py-1">
            {/* Left: Text/CTA */}
            <div className="text-center md:text-left order-2 md:order-1 animate-fade-in-smooth">
              <div className="max-w-2xl">
                <h1 
                  className="text-5xl md:text-6xl xl:text-7xl font-light tracking-[-0.02em] text-foreground mb-3 leading-[1.08] scroll-fade"
                  data-testid="hero-title"
                  style={{ transitionDelay: "0ms" }}
                >Transform Hiring  <span className="ml-3">with</span>
                  <br />
                  <span className="gradient-text font-medium ml-3">Intelligent Assessments</span>
                </h1>

                <p 
                  className="text-lg md:text-xl text-muted-foreground/90 text-gray-200 mb-3 leading-relaxed scroll-fade"
                  data-testid="hero-tagline"
                  style={{ transitionDelay: "120ms" }}
                >
                  Hire Smarter, Faster.
                </p>

                <p 
                  className="text-md text-muted-foreground/90 text-gray-200 mb-6 leading-relaxed scroll-fade"
                  data-testid="hero-subtitle"
                  style={{ transitionDelay: "240ms" }}
                >
                  Create enterprise-grade skill quizzes in under 3 minutes and filter the right candidates instantly.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-1">
                  <Button
                    aria-label="Get Started"
                    className="inline-flex items-center rounded-xl px-4 md:px-6 py-2 md:py-4 bg-white text-black 
                               shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 
                               text-base md:text-sm ring-1 ring-black/10 hover:ring-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:translate-x-2 duration-150"
                    data-testid="button-get-started"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                  <Button 
                    variant="outline"
                    aria-label="Book a demo"
                    className="md:ml-2 inline-flex items-center rounded-xl px-4 md:px-6 py-2 md:py-4 bg-transparent border border-white/70 text-white 
                               hover:bg-white/10 hover:border-white transition-all duration-300 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:translate-x-2 duration-150"
                  >
                    Book a Demo
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Logo Animation */}
            <div className="order-1 md:order-2 flex justify-center md:justify-end" aria-hidden="true">
              <div className="w-full md:w-[min(78vh,1000px)] lg:w-[min(82vh,1100px)] aspect-square md:aspect-auto md:h-[min(78vh,1000px)] lg:h-[min(82vh,1100px)]">
                <HeroLogoSVG size="100%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section (video only, centered) */}
      <section id="demo" className="py-12 sm:py-16 bg-background scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glassmorphism rounded-2xl p-1">
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/LM683z0glJM"
                title="QuizzViz Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve Section */}
      <section 
        id="problems" 
        className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
        data-testid="problems-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-fade visible">
            <h2 
              className="text-4xl lg:text-5xl font-light text-foreground mb-6"
              data-testid="problems-title"
            >
              Problems We <span className="gradient-text font-medium">Solve</span>
            </h2>
            <p 
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              data-testid="problems-subtitle"
            >
              Transform your hiring process with intelligent solutions that save time and identify the right talent.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Problem 1 - Speed */}
            <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="problem-speed-title">
                  Speed
                </h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="problem-speed-description">
                  Making a good, real-world quiz takes at least a week. QuizzViz enables companies to create high-quality quizzes in{" "}
                  <strong className="text-white">under 3 minutes</strong>.
                </p>
              </CardContent>
            </Card>
            
            {/* Problem 2 - Accuracy */}
            <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="problem-accuracy-title">
                  Accuracy
                </h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="problem-accuracy-description">
                  Helps filter participants with the right skillset, improving{" "}
                  <strong className="text-white">applicant satisfaction</strong> through fair and relevant assessments.
                </p>
              </CardContent>
            </Card>
            
            {/* Problem 3 - Efficiency */}
            <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="problem-efficiency-title">
                  Efficiency
                </h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="problem-efficiency-description">
                  Saves companies' time by avoiding interviews with{" "}
                  <strong className="text-white">wrong candidates</strong> through precise skill matching.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
        data-testid="features-section"
      >
        {/* Modern office workspace background with subtle overlay */}
        <div className="absolute inset-0 opacity-10">
          <div 
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }} 
            className="w-full h-full"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-fade visible">
            <h2 
              className="text-4xl lg:text-5xl font-light text-foreground mb-6"
              data-testid="features-title"
            >
              Features & <span className="gradient-text font-medium">Benefits</span>
            </h2>
            <p 
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              data-testid="features-subtitle"
            >
              Enterprise-grade capabilities designed for modern hiring teams.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Lightning Speed */}
            <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="feature-speed-title">
                  Lightning Speed
                </h3>
                <p className="text-muted-foreground" data-testid="feature-speed-description">
                  Create comprehensive skill assessments in under 3 minutes with our AI-powered quiz generator.
                </p>
              </CardContent>
            </Card>
            
            {/* Precision Matching */}
            <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="feature-accuracy-title">
                  Precision Matching
                </h3>
                <p className="text-muted-foreground" data-testid="feature-accuracy-description">
                  Advanced algorithms ensure candidates are matched based on actual skills, not just keywords.
                </p>
              </CardContent>
            </Card>
            
            {/* Smart Efficiency */}
            <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="feature-efficiency-title">
                  Smart Efficiency
                </h3>
                <p className="text-muted-foreground" data-testid="feature-efficiency-description">
                  Streamline your hiring pipeline and reduce time-to-hire by focusing on qualified candidates only.
                </p>
              </CardContent>
            </Card>
            
            {/* Enterprise Scale */}
            <Card className="glassmorphism rounded-2xl hover:bg-white/10 transition-all duration-300 scroll-fade visible border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="feature-scale-title">
                  Enterprise Scale
                </h3>
                <p className="text-muted-foreground" data-testid="feature-scale-description">
                  Built to handle high-volume hiring with enterprise-grade security and reliability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
        data-testid="how-it-works-section"
      >
        {/* Professional meeting room background */}
        <div className="absolute inset-0 opacity-5">
          <div 
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }} 
            className="w-full h-full"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-fade visible">
            <h2 
              className="text-4xl lg:text-5xl font-light text-foreground mb-6"
              data-testid="how-it-works-title"
            >
              How It <span className="gradient-text font-medium">Works</span>
            </h2>
            <p 
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              data-testid="how-it-works-subtitle"
            >
              Three simple steps to revolutionize your hiring process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center scroll-fade visible" data-testid="step-1">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="step-1-title">
                Create Quiz
              </h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="step-1-description">
                Input your job requirements and let our AI generate comprehensive skill assessments tailored to your specific needs.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center scroll-fade visible" data-testid="step-2">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="step-2-title">
                Assess Candidates
              </h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="step-2-description">
                Send quizzes to candidates and get real-time results with detailed analytics and skill breakdowns.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center scroll-fade visible" data-testid="step-3">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4" data-testid="step-3-title">
                Make Decisions
              </h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="step-3-description">
                Review comprehensive candidate rankings and insights to make informed hiring decisions quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section 
        id="cta" 
        className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
        data-testid="cta-section"
      >
        {/* Elegant office interior background */}
        <div className="absolute inset-0 opacity-5">
          <div 
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1568992687947-868a62a9f521?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }} 
            className="w-full h-full"
          />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="scroll-fade">
            <h2 
              className="text-4xl lg:text-5xl font-light text-foreground mb-6"
              data-testid="cta-title"
            >
              Ready to Transform Your <span className="gradient-text font-medium">Hiring?</span>
            </h2>
            <p 
              className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
              data-testid="cta-subtitle"
            >
              Join forward-thinking companies using QuizzViz to build better teams faster.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => scrollToSection("signup")}
                className="inline-flex items-center px-10 py-6 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                data-testid="button-start-trial"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => scrollToSection("demo")}
                className="inline-flex items-center px-10 py-6 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-black transition-all duration-300"
                data-testid="button-book-demo"
              >
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
