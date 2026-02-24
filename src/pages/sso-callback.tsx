import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function SSOCallback() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is signed in, check their intent and handle accordingly
    if (isSignedIn && user) {
      const authIntent = sessionStorage.getItem('authIntent');
      const createdAt = user.createdAt;
      const now = new Date();
      const userAge = createdAt ? now.getTime() - new Date(createdAt).getTime() : Infinity;
      
      console.log('SSO Callback:', {
        authIntent,
        userAge,
        createdAt,
        isNewUser: userAge < 60000
      });
      
      // Clear the intent after using it
      sessionStorage.removeItem('authIntent');
      
      if (authIntent === 'signup') {
        // User intended to sign up
        if (userAge < 60000) {
          // New user - proceed to onboarding
          router.push("/onboarding");
        } else {
          // Existing user who tried to sign up - redirect to signin with message
          router.push("/signin?message=Account already exists. Please sign in.");
        }
      } else if (authIntent === 'signin') {
        // User intended to sign in - always go to dashboard
        router.push("/dashboard");
      } else {
        // Default behavior - check if new user
        if (userAge < 60000) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [isSignedIn, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
        <h1 className="mt-4 text-xl font-medium text-gray-100 sm:text-2xl">
          Redirecting...
        </h1>
        <p className="mt-2 text-gray-100">
          Please wait while we log you in.
        </p>
      </div>
      <div className="invisible">
        {/* This is the actual redirect component that will do the work */}
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
}