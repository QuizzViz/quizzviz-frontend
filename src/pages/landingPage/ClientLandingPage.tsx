'use client';

import dynamic from "next/dynamic";

const HowItWorksSection = dynamic(() => import("./parts/HowItWorksSection"), {
  ssr: false,
});
const HeroSection = dynamic(() => import("./parts/HeroSection"), {
  ssr: false,
});
const ProblemsSection = dynamic(() => import("./parts/ProblemsSection"), {
  ssr: false,
});
const FeaturesSection = dynamic(() => import("./parts/FeaturesSection"), {
  ssr: false,
});
const CTASection = dynamic(() => import("./parts/CTASection"), {
  ssr: false,
});
const DemoSection = dynamic(() => import("./parts/DemoSection"), {
  ssr: false,
});
const FAQsSection = dynamic(() => import("./parts/FAQsSection"), {
  ssr: false,
});

import { Navbar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { UserTypeProvider } from "@/contexts/UserTypeContext";

const ClientLandingPage = () => {
  return (
    <UserTypeProvider>
      <div className="min-h-screen mt-24 md:mt-0">
        <Navbar />
        <HeroSection />
        <DemoSection />
        <ProblemsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FAQsSection />
        <CTASection />
        <Footer/>
      </div>
    </UserTypeProvider>
  );
};

export default ClientLandingPage;
