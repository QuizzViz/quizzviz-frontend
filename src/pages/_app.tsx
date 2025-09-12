import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import "../app/globals.css";
import { Navbar } from "@/components/NavBar";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // 👇 Add the route(s) where you DON'T want the navbar
  const noNavbarPrefix = "/dashboard"; // hide navbar on /dashboard and nested routes

  const hideNavbar = router.pathname.startsWith(noNavbarPrefix);

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      {...pageProps}
    >
      {!hideNavbar && <Navbar />} {/* Navbar hidden only on /dashboard */}
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
