import { Navbar } from "@/components/NavBar";
import { UserTypeProvider } from "@/contexts/UserTypeContext";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import CTASection from "./parts/CTASection";
import DemoSection from "./parts/DemoSection";
import FAQsSection from "./parts/FAQsSection";
import FeaturesSection from "./parts/FeaturesSection";
import HeroSection from "./parts/HeroSection";
import HowItWorksSection from "./parts/HowItWorksSection";
import ProblemsSection from "./parts/ProblemsSection";
import { Footer } from "@/components/Footer";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
  </div>
);

const SearchParamsHandler = () => {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'deleted') {
      toast({
        title: "Access Removed",
        description: "You have been removed from the company. You have been logged out for security reasons.",
        variant: "destructive",
      });
      
      // Clean up the URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);
  
  return null;
};

const ClientLandingPage = () => {
  return (
      <UserTypeProvider>
        <div className="min-h-screen mt-24 md:mt-0">
          <Suspense fallback={<LoadingFallback />}>
            <SearchParamsHandler />
            <Navbar />
            <HeroSection />
            <DemoSection />
            <ProblemsSection />
            <FeaturesSection />
            <HowItWorksSection />
            <FAQsSection />
            <CTASection />
            <Footer />
          </Suspense>
        </div>
      </UserTypeProvider>
  );
};

export default ClientLandingPage;
