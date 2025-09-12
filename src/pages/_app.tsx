import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import "../app/globals.css";
import { Navbar } from "@/components/NavBar";
import { useRouter } from "next/router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Routes where we DO NOT want the global Navbar (dashboard shell handles its own nav)
  const path = router.asPath || router.pathname;
  const hideNavbar = path.startsWith("/dashboard") || path.startsWith("/quiz");

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} {...pageProps}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {!hideNavbar && <Navbar />} {/* Hide on /dashboard and /quiz */}
          <Component {...pageProps} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default MyApp;
