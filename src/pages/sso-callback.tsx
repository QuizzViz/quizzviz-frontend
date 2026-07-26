import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

export default function SSOCallback() {
  const clerk = useClerk();
  const { isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    // Wait for Clerk itself to finish loading, and only ever run this once.
    // (Previously this drove off <AuthenticateWithRedirectCallback>'s
    // afterSignInUrl/afterSignUpUrl/onAuthenticateWithRedirectCallback
    // props — none of which exist on this Clerk SDK version, so they were
    // silently ignored, the completion callback never fired, and our
    // custom redirect logic below never ran at all. What was actually
    // happening was Clerk's own built-in fallback: with no working custom
    // handling, a failed callback falls back to the app's globally
    // configured signInUrl ("/signin" in _app.tsx) regardless of why it
    // failed. Calling clerk.handleRedirectCallback() directly is the
    // documented way to intercept this and decide the destination
    // ourselves.)
    if (!isUserLoaded || hasRun.current) return;
    hasRun.current = true;

    const authIntent = sessionStorage.getItem("authIntent");
    sessionStorage.removeItem("authIntent");
    sessionStorage.removeItem("oauthStartTime");
    sessionStorage.removeItem("signupAttemptTime");

    const noAccountFound = () =>
      clerk.client?.signIn?.firstFactorVerification?.error?.code === "external_account_not_found";

    const accountAlreadyExists = () =>
      clerk.client?.signUp?.verifications?.externalAccount?.error?.code === "external_account_exists";

    const decideDestination = (fallback: string) => {
      if (authIntent !== "signup" && noAccountFound()) {
        return "/signup?message=" + encodeURIComponent("No account found. Please sign up with Google.");
      }
      if (authIntent === "signup" && accountAlreadyExists()) {
        return "/signin?message=" + encodeURIComponent("Account already exists. Please sign in with Google.");
      }
      if (fallback === "/dashboard" || fallback === "/onboarding") {
        return fallback;
      }
      return authIntent === "signup" ? "/onboarding" : "/dashboard";
    };

    clerk
      .handleRedirectCallback(
        {
          // Clerk's default (transferable: true) auto-transfers a failed
          // sign-in into a brand-new, incomplete sign-up behind the scenes
          // ("prevents opaque sign ups" is literally the opposite of what
          // we want here) — that's what the Clerk dashboard logs showed:
          // oauth_callback.failed (reason external_account_not_found)
          // followed immediately by sign_up.external_account.connected,
          // even though the user only ever tried to sign IN. With transfer
          // off, a sign-in with no matching account just fails cleanly, so
          // our own noAccountFound()/catch logic below can actually decide
          // to send the user to /signup instead of Clerk silently doing it.
          transferable: false,
          signInFallbackRedirectUrl: "/dashboard",
          signUpFallbackRedirectUrl: "/onboarding",
        },
        async (to: string) => {
          await router.push(decideDestination(to));
        }
      )
      .catch((err: any) => {
        const code = err?.errors?.[0]?.code;
        console.error("OAuth callback failed:", err);
        if (code === "external_account_not_found") {
          router.push("/signup?message=" + encodeURIComponent("No account found. Please sign up with Google."));
        } else if (code === "external_account_exists" || code === "identifier_already_signed_in") {
          router.push("/signin?message=" + encodeURIComponent("Account already exists. Please sign in with Google."));
        } else {
          router.push("/signin");
        }
      });
  }, [isUserLoaded, clerk, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
        <h1 className="mt-4 text-xl font-medium text-gray-100 sm:text-2xl">Redirecting...</h1>
        <p className="mt-2 text-gray-100">Please wait while we log you in.</p>
      </div>
    </div>
  );
}
