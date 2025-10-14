"use client";
import { Navbar } from "@/components/NavBar";
import { UserTypeProvider } from "@/contexts/UserTypeContext";
import { Suspense } from "react";
import CTASection from "./parts/CTASection";
import DemoSection from "./parts/DemoSection";
import FAQsSection from "./parts/FAQsSection";
import FeaturesSection from "./parts/FeaturesSection";
import HeroSection from "./parts/HeroSection";
import HowItWorksSection from "./parts/HowItWorksSection";
import ProblemsSection from "./parts/ProblemsSection";
import { Footer } from "@/components/Footer";

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
  </div>
);

const ClientLandingPage = () => {
  return (
      <UserTypeProvider>
        <div className="min-h-screen mt-24 md:mt-0">
          <Suspense fallback={<LoadingFallback />}>
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
