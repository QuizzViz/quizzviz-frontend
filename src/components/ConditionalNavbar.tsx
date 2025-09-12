"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/NavBar";

export default function ConditionalNavbar() {
  const pathnameFromHook = usePathname();
  const [mounted, setMounted] = useState(false);
  const [pathnameFallback, setPathnameFallback] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Fallback for Pages Router where usePathname may be undefined during SSR
    if (typeof window !== "undefined") {
      setPathnameFallback(window.location.pathname);
    }
  }, []);

  const pathname = pathnameFromHook ?? pathnameFallback ?? null;

  // Hide only on the dynamic quiz details page: /quiz/[id]
  const hideNavbar = useMemo(() => {
    if (!pathname) return true; // Avoid rendering until path is known to prevent SSR flicker
    const isQuizDetail = /^\/quiz\/[^/]+$/.test(pathname);
    return isQuizDetail;
  }, [pathname]);

  // Avoid SSR flicker: don't render Navbar until mounted and path resolved
  if (!mounted) return null;
  if (hideNavbar) return null;
  return <Navbar />;
}
