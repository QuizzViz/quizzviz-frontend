import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SSOCallback() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const [callbackComplete, setCallbackComplete] = useState(false);

  useEffect(() => {
    // Wait until Clerk is loaded AND the redirect callback has finished
    if (!isLoaded || !callbackComplete) return;

    if (isSignedIn && user) {
      const authIntent = sessionStorage.getItem('authIntent');
      const signupAttemptTime = sessionStorage.getItem('signupAttemptTime');
      const createdAt = user.createdAt;
      const now = new Date();
      const userAge = createdAt ? now.getTime() - new Date(createdAt).getTime() : Infinity;
      const isRecentSignupAttempt = signupAttemptTime
        ? now.getTime() - parseInt(signupAttemptTime) < 30000
        : false;

      console.log('SSO Callback Details:', {
        authIntent,
        userAge,
        userAgeInMinutes: userAge / (1000 * 60),
        isRecentSignupAttempt,
        isNewUser: userAge < 300000,
        userEmail: user.primaryEmailAddress?.emailAddress,
      });

      // Clear after reading
      sessionStorage.removeItem('authIntent');
      sessionStorage.removeItem('signupAttemptTime');

      if (authIntent === 'signup') {
        if (isRecentSignupAttempt && userAge >= 300000) {
          // Existing user tried to sign up → redirect to signin
          router.push("/signin?message=Account already exists. Please sign in.");
        } else if (userAge < 300000) {
          // Genuinely new user → onboarding
          router.push("/onboarding");
        } else {
          // Fallback
          router.push("/dashboard");
        }
      } else if (authIntent === 'signin') {
        router.push("/dashboard");
      } else {
        // No intent set — default routing based on user age
        router.push(userAge < 300000 ? "/onboarding" : "/dashboard");
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