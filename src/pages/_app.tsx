import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import "../app/globals.css";
import { Navbar } from "@/components/NavBar";
import { useRouter } from "next/router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { QuizGenerationProvider } from "@/contexts/QuizGenerationContext";
import { GenerationStatusIndicator } from "@/components/Dashboard/GenerationStatusIndicator";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Routes where we DO NOT want the global Navbar (dashboard shell handles its own nav)
  const path = router.asPath || router.pathname;
  const hideNavbar = path.startsWith("/dashboard") || path.startsWith("/quiz");

  return (
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      {...pageProps}
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          footerActionLink: 'text-primary hover:text-primary/80',
        },
      }}
      signInUrl="/signin"
      signUpUrl="/signup"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {!hideNavbar && <Navbar />} {/* Hide on /dashboard and /quiz */}
          <QuizGenerationProvider>
            <Component {...pageProps} />
            <Toaster />
            <GenerationStatusIndicator />
          </QuizGenerationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default MyApp;
