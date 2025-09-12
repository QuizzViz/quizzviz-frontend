"use client";

// App route entry for the marketing/landing experience
// Delegates rendering to `src/pages/landingPage` to keep this file lean
import Home from "@/pages/landingPage";


export default function Page() {
  // Thin wrapper to allow server/app shell to host a client-only landing page
  return (
    <div>
      <Home />
    </div>
  );
}
