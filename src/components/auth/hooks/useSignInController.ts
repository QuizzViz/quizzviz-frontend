import { useCallback, useState, FormEvent } from "react";
import { useSignIn, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";

// Consolidates all state and actions for the custom Sign In flow
export function useSignInController() {
  const { signIn, isLoaded } = useSignIn();
  const { setActive, signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "oauth_google">(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = useCallback(
    async (provider: "oauth_google") => {
      if (!isLoaded || !signIn) return;
      if (user) {
        setError("You are already signed in. Use 'Switch account' to continue with another account.");
        return;
      }
      try {
        setOauthLoading(provider);
        // Store the intent in sessionStorage so we can check it in the callback
        sessionStorage.setItem('authIntent', 'signin');
        await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/dashboard",
        });
      } catch (err: any) {
        const msg = (err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "").toString();
        
        // Debug logging for OAuth errors
        console.log("OAuth SignIn Error:", {
          message: msg,
          fullError: err,
          errors: err?.errors
        });
        
        // Check if OAuth error indicates account doesn't exist
        if (msg.toLowerCase().includes("not found") || 
            msg.toLowerCase().includes("doesn't exist") || 
            msg.toLowerCase().includes("no account found") ||
            msg.toLowerCase().includes("identifier not found")) {
          // Redirect to sign up page for OAuth
          router.push(`/signup?message=No account found. Please sign up with Google.`);
        } else {
          setError(msg || "Failed to continue with provider. Check provider configuration in Clerk.");
        }
        setOauthLoading(null);
      }
    },
    [isLoaded, signIn, user, router]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/");
      } else {
        setError("Additional steps required. Please use a social provider.");
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || "Invalid email or password.";
      const errorCode = err?.errors?.[0]?.code;
      
      // Debug logging to see actual error structure
      console.log("SignIn Error:", {
        message: errorMessage,
        code: errorCode,
        fullError: err,
        errors: err?.errors
      });
      
      // Check if the error indicates the account doesn't exist
      if (errorCode === "identifier_not_found") {
        // Redirect to sign up page with email pre-filled
        router.push(`/signup?email=${encodeURIComponent(email)}&message=${encodeURIComponent("No account found. Please sign up.")}`);
        return;
      }
      
      // For wrong password, show error (don't redirect)
      if (errorCode === "form_password_incorrect") {
        setError("Incorrect password. Please try again.");
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    // state
    email,
    setEmail,
    password,
    setPassword,
    loading,
    oauthLoading,
    error,
    setError,
    isLoaded,
    user,
    // actions
    handleOAuth,
    onSubmit,
    signOut,
    router,
  };
}
