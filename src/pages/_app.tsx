"use client"
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
import { UserPlanProvider } from "@/contexts/UserPlanContext";
import { useEffect } from 'react'
import { Router } from 'next/router'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import Hotjar from '@hotjar/browser';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

   useEffect(() => {
    if (typeof window !== "undefined") {
      const siteId = 5134605;
      const hotjarVersion = 6;
      try {
        Hotjar.init(siteId, hotjarVersion);
      } catch (err) {
        console.error("Hotjar init failed:", err);
      }
    }
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only', 
      defaults: '2025-05-24',
      
    })
  }, [])

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
          <PostHogProvider client={posthog}>
            <UserPlanProvider>
              <QuizGenerationProvider>
                <div className="min-h-screen bg-background">
                  {!hideNavbar && <Navbar />}
                  <Component {...pageProps} />
                  <Toaster />
                  <GenerationStatusIndicator />
                </div>
              </QuizGenerationProvider>
            </UserPlanProvider>
          </PostHogProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default MyApp;
