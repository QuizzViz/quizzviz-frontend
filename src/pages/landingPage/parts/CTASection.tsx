import { FC } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Final call-to-action with two buttons (start trial / book demo)
 const CTASection: FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section id="cta" className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
      <div className="absolute inset-0 opacity-5">
        <div
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1568992687947-868a62a9f521?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')", backgroundSize: "cover", backgroundPosition: "center" }}
          className="w-full h-full"
        />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="scroll-fade">
          <h2 className="text-4xl lg:text-5xl font-light text-foreground mb-6">Ready to Transform Your <span className="gradient-text font-medium">Hiring?</span></h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">Join forward-thinking companies using QuizzViz to build better teams faster.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => scrollTo("signup")} className="inline-flex items-center px-10 py-6 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={() => scrollTo("demo")} className="inline-flex items-center px-10 py-6 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-black transition-all duration-300">
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection
