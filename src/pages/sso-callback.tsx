import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SSOCallback() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const [callbackComplete, setCallbackComplete] = useState(false);

  useEffect(() => {
    // Wait until Clerk is loaded AND redirect callback has finished
    if (!isLoaded || !callbackComplete) return;

    // HANDLE FAILED OAUTH HERE - Before main logic
    if (!isSignedIn) {
      const authIntent = sessionStorage.getItem("authIntent");

      if (authIntent === "signin") {
        router.push("/signup?message=No account found. Please sign up with Google.");
      } else if (authIntent === "signup") {
        router.push("/signin?message=Account already exists. Please sign in with Google.");
      } else {
        router.push("/signin");
      }

      return;
    }

    if (isSignedIn && user) {
      const authIntent = sessionStorage.getItem('authIntent');

      // Clear after reading
      sessionStorage.removeItem('authIntent');
      sessionStorage.removeItem('signupAttemptTime');

      if (authIntent === 'signup') {
        router.push("/onboarding");
      } else if (authIntent === 'signin') {
        router.push("/dashboard");
      } else {
        // No intent set — default to onboarding
        router.push("/onboarding");
      }
    }
  }, [isSignedIn, user, isLoaded, callbackComplete, router]);

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

      <div className="invisible">
        <AuthenticateWithRedirectCallback
          afterSignInUrl="/sso-callback"
          afterSignUpUrl="/sso-callback"
          // @ts-ignore
          onAuthenticateWithRedirectCallback={() => setCallbackComplete(true)}
        />
      </div>
    </div>
  );
}