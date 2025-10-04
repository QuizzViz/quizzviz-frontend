"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { UserTypeProvider } from "@/contexts/UserTypeContext";

// Client-side only components
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
};

// Dynamically import all sections with SSR disabled
const Navbar = dynamic(
  () => import("@/components/NavBar").then((mod) => mod.Navbar),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
);

const Footer = dynamic(
  () => import("@/components/Footer").then((mod) => mod.Footer),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
);

const HeroSection = dynamic(
  () => import("./parts/HeroSection"),
  { ssr: false, loading: () => <div className="min-h-screen" /> }
);

const DemoSection = dynamic(
  () => import("./parts/DemoSection"),
  { ssr: false, loading: () => <div className="min-h-[80vh]" /> }
);

const ProblemsSection = dynamic(
  () => import("./parts/ProblemsSection"),
  { ssr: false, loading: () => <div className="min-h-[80vh]" /> }
);

const FeaturesSection = dynamic(
  () => import("./parts/FeaturesSection"),
  { ssr: false, loading: () => <div className="min-h-[80vh]" /> }
);

const HowItWorksSection = dynamic(
  () => import("./parts/HowItWorksSection"),
  { ssr: false, loading: () => <div className="min-h-[80vh]" /> }
);

const FAQsSection = dynamic(
  () => import("./parts/FAQsSection"),
  { ssr: false, loading: () => <div className="min-h-[50vh]" /> }
);

const CTASection = dynamic(
  () => import("./parts/CTASection"),
  { ssr: false, loading: () => <div className="min-h-[60vh]" /> }
);

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
  </div>
);

const ClientLandingPage = () => {
  return (
    <ClientOnly>
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
    </ClientOnly>
  );
};

export default ClientLandingPage;
