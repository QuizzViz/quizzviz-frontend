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

    // Log the raw state every time, not just on a hunch it's needed —
    // this is the only way to get a real captured object out of Clerk's
    // client runtime (@clerk/clerk-js is loaded from Clerk's CDN, not
    // present in node_modules, so it can't be inspected statically).
    console.log("[sso-callback] signIn.firstFactorVerification:", clerk.client?.signIn?.firstFactorVerification);
    console.log("[sso-callback] signUp.verifications.externalAccount:", clerk.client?.signUp?.verifications?.externalAccount);

    // ClerkAPIError.code (per @clerk/types) is the only documented, stable
    // field for a value like "external_account_not_found" — there is no
    // `reason` field on the client-side error type (that's Clerk dashboard/
    // webhook terminology for the same underlying code). Check every place
    // that code can plausibly surface: on the resource's verification
    // error, on its errors array (some Clerk versions attach ClerkAPIError[]
    // directly to the resource), and via the status field as a secondary
    // signal, before ever falling back to message text.
    const errorCodesOf = (resource: any): string[] => {
      const codes: string[] = [];
      if (resource?.error?.code) codes.push(resource.error.code);
      if (Array.isArray(resource?.errors)) {
        for (const e of resource.errors) if (e?.code) codes.push(e.code);
      }
      return codes;
    };

    const noAccountFound = () => {
      const v = clerk.client?.signIn?.firstFactorVerification;
      const codes = errorCodesOf(v);
      return (
        codes.includes("external_account_not_found") ||
        v?.status === "failed" && codes.some((c) => c.includes("not_found"))
      );
    };

    const accountAlreadyExists = () => {
      const v = clerk.client?.signUp?.verifications?.externalAccount;
      const codes = errorCodesOf(v);
      return codes.includes("external_account_exists") || codes.includes("identifier_already_signed_in");
    };

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
        // This is the actual captured error object — check the browser
        // console on the next repro and paste this back if the redirect is
        // still wrong; it's the ground truth no amount of static reading of
        // @clerk/types can substitute for.
        console.error("[sso-callback] handleRedirectCallback rejected:", err);
        console.error("[sso-callback] err.errors:", err?.errors);

        const codes: string[] = [];
        if (err?.code) codes.push(err.code);
        if (Array.isArray(err?.errors)) {
          for (const e of err.errors) if (e?.code) codes.push(e.code);
        }
        const message = (
          err?.message || err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || ""
        ).toString().toLowerCase();

        if (codes.includes("external_account_not_found")) {
          router.push("/signup?message=" + encodeURIComponent("No account found. Please sign up with Google."));
        } else if (codes.includes("external_account_exists") || codes.includes("identifier_already_signed_in")) {
          router.push("/signin?message=" + encodeURIComponent("Account already exists. Please sign in with Google."));
        } else if (authIntent !== "signup" && message.includes("not found")) {
          // No stable code came through at all — fall back to the message
          // text rather than silently landing on /signin with no signal.
          router.push("/signup?message=" + encodeURIComponent("No account found. Please sign up with Google."));
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
