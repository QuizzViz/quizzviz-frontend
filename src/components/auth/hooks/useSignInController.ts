import { useCallback, useState, FormEvent } from "react";
import { useSignIn, useSignUp, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";

// Consolidates all state and actions for the custom Sign In flow
export function useSignInController() {
  const { signIn, isLoaded } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive, signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "oauth_google">(null);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

  const handleOAuth = useCallback(
    async (provider: "oauth_google") => {
      if (!isLoaded || !signIn || !signUp) return;
      if (user) {
        setError("You are already signed in. Use 'Switch account' to continue with another account.");
        return;
      }
      try {
        setOauthLoading(provider);
        // Store the intent and timestamp so we can check it in the callback
        sessionStorage.setItem('authIntent', 'signin');
        sessionStorage.setItem('oauthStartTime', Date.now().toString());
        await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/dashboard",
        });
      } catch (err: any) {
        // signIn.authenticateWithRedirect() navigates the whole browser tab to
        // Google — verified directly against this project's resolved
        // @clerk/clerk-js@5.99.0 source: once that navigation happens, this
        // promise never resolves or rejects again in this tab. This catch can
        // therefore only fire for a PRE-redirect problem (bad OAuth strategy
        // config, network error before the redirect starts) — NOT for "no
        // account exists," which can only be determined after Google redirects
        // back. That determination, and the redirect to /signup for it, is
        // handled entirely in sso-callback.tsx.
        const msg = (err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "").toString();
        console.error("OAuth SignIn pre-redirect error:", { message: msg, code: err?.errors?.[0]?.code, fullError: err });
        setError(msg || "Failed to continue with provider. Check provider configuration in Clerk.");
        setOauthLoading(null);
      }
    },
    [isLoaded, signIn, signUp, user, router]
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
        router.push("/dashboard");
      } else {
        setError("Additional steps required. Please use a social provider.");
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || "Invalid email or password.";
      const errorCode = err?.errors?.[0]?.code;
      
      // Enhanced debugging to see actual error structure
      console.log("SignIn Error - Full Analysis:", {
        message: errorMessage,
        code: errorCode,
        fullError: err,
        errors: err?.errors,
        longMessage: err?.errors?.[0]?.longMessage,
        messageLower: errorMessage.toLowerCase(),
        email: email
      });
      
      // Check if the error indicates that account doesn't exist - multiple scenarios
      const isAccountNotFound = 
        errorCode === "identifier_not_found" ||
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("doesn't exist") ||
        errorMessage.toLowerCase().includes("no account found") ||
        errorMessage.toLowerCase().includes("identifier not found") ||
        errorMessage.toLowerCase().includes("user not found") ||
        errorMessage.toLowerCase().includes("account does not exist") ||
        errorMessage.toLowerCase().includes("email not found") ||
        errorMessage.toLowerCase().includes("invalid credentials") ||
        errorMessage.toLowerCase().includes("invalid email or password");
      
      console.log("Account Not Found Check:", {
        isAccountNotFound,
        errorCode,
        messageChecks: {
          "not found": errorMessage.toLowerCase().includes("not found"),
          "doesn't exist": errorMessage.toLowerCase().includes("doesn't exist"),
          "no account found": errorMessage.toLowerCase().includes("no account found"),
          "identifier not found": errorMessage.toLowerCase().includes("identifier not found"),
          "user not found": errorMessage.toLowerCase().includes("user not found"),
          "account does not exist": errorMessage.toLowerCase().includes("account does not exist"),
          "email not found": errorMessage.toLowerCase().includes("email not found"),
          "invalid credentials": errorMessage.toLowerCase().includes("invalid credentials"),
          "invalid email or password": errorMessage.toLowerCase().includes("invalid email or password")
        }
      });
      
      if (isAccountNotFound) {
        // Show redirect message and delay redirect
        setLoading(false);
        console.log("Redirecting to signup page...");
        setRedirectMessage("Account doesn't exist. Redirecting to sign up page...");
        setRedirecting(true);
        console.log("Setting redirecting to true, will redirect in 2 seconds");
        setTimeout(() => {
          console.log("Redirecting to signup page");
          router.push(`/signup?email=${encodeURIComponent(email)}&message=${encodeURIComponent("No account found. Please sign up.")}`);
        }, 2000);
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
    redirecting,
    redirectMessage,
    // actions
    handleOAuth,
    onSubmit,
    signOut,
    router,
  };
}
