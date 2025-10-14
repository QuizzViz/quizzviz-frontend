"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import { UserTypeProvider } from "@/contexts/UserTypeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UserTypeProvider>
            <Toaster />
            {children}
          </UserTypeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
