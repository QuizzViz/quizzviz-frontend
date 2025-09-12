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

  const hideNavbar = useMemo(() => {
    if (!pathname) return true; // Avoid showing Navbar before we know the path
    return pathname.startsWith("/dashboard") || pathname.startsWith("/quiz");
  }, [pathname]);

  // Avoid SSR flicker: don't render Navbar until mounted and path resolved
  if (!mounted) return null;
  if (hideNavbar) return null;
  return <Navbar />;
}
