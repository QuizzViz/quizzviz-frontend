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
    // custom redirect logic below never ran at all. Calling
    // clerk.handleRedirectCallback() directly is the documented way to
    // intercept this and decide the destination ourselves.)
    if (!isUserLoaded || hasRun.current) return;
    hasRun.current = true;

    const authIntent = sessionStorage.getItem("authIntent");
    sessionStorage.removeItem("authIntent");
    sessionStorage.removeItem("oauthStartTime");
    sessionStorage.removeItem("signupAttemptTime");

    const signInStatus = clerk.client?.signIn?.firstFactorVerification?.status;
    const externalAccount = clerk.client?.signUp?.verifications?.externalAccount;
    const externalAccountStatus = externalAccount?.status;
    const externalAccountErrorCode = externalAccount?.error?.code;

    console.log("[sso-callback] signIn.firstFactorVerification.status:", signInStatus);
    console.log("[sso-callback] signUp.externalAccount.status/errorCode:", externalAccountStatus, externalAccountErrorCode);

    // THE ACTUAL BUG: verified directly against @clerk/clerk-js@5.99.0's source
    // (the version this app's @clerk/nextjs^6.33.3 / @clerk/clerk-react@5.51.0
    // resolves to — same release timestamp). clerk.handleRedirectCallback()
    // makes this exact internal decision on a "transferable" sign-in:
    //
    //   const userNeedsToBeCreated = si.firstFactorVerificationStatus === 'transferable';
    //   if (userNeedsToBeCreated) {
    //     if (params.transferable === false) {
    //       return navigateToSignIn();               // <- Clerk's OWN navigation, not ours
    //     }
    //     const res = await signUp.create({ transfer: true, ... });  // <- silent auto-signup
    //   }
    //
    // Passing transferable:false (the previous fix) does NOT make the promise
    // fail cleanly into our own success/catch handlers below — it makes Clerk
    // call navigateToSignIn() itself, which goes to the app's configured
    // signInUrl ("/signin"), bypassing all of our custom logic entirely. That
    // is exactly the reported symptom: "sign-in doesn't redirect to sign-up."
    // The default (transferable:true) is just as wrong the other way — it
    // silently completes the signup (sign_up.external_account.connected in
    // the Clerk dashboard logs, even though the user only ever clicked
    // "Sign in"). Neither of handleRedirectCallback's two built-in behaviors
    // is what we want, so we must detect "transferable" ourselves BEFORE
    // calling handleRedirectCallback, and skip calling it entirely for this
    // case — this status is already populated on the client as soon as the
    // browser lands back here from Google, independent of that call.
    if (authIntent !== "signup" && signInStatus === "transferable") {
      router.push("/signup?message=" + encodeURIComponent("No account found. Please sign up with Google."));
      return;
    }
    if (authIntent === "signup" && externalAccountStatus === "transferable" && externalAccountErrorCode === "external_account_exists") {
      router.push("/signin?message=" + encodeURIComponent("Account already exists. Please sign in with Google."));
      return;
    }

    // Neither transfer scenario applies — normal success/failure path.
    clerk
      .handleRedirectCallback(
        {
          signInFallbackRedirectUrl: "/dashboard",
          signUpFallbackRedirectUrl: "/onboarding",
        },
        async (to: string) => {
          await router.push(to === "/dashboard" || to === "/onboarding" ? to : authIntent === "signup" ? "/onboarding" : "/dashboard");
        }
      )
      .catch((err: any) => {
        // Genuinely unexpected failure (not the transferable case, which is
        // handled above before this call even runs). Check the browser
        // console on the next repro and paste this back if something is
        // still wrong — it's the ground truth no amount of static reading
        // of @clerk/types can substitute for.
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
