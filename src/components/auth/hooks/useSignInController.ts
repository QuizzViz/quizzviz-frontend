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
        // Store the intent and timestamp so we can check it in the callback
        sessionStorage.setItem('authIntent', 'signin');
        sessionStorage.setItem('oauthStartTime', Date.now().toString());
        await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/sso-callback",
        });
      } catch (err: any) {
        // Handle different error structures for OAuth
        let msg = "";
        let errorCode = "";
        
        // Check for nested error structure (OAuth verification errors)
        if (err?.response?.sign_in?.first_factor_verification?.error) {
          const oauthError = err.response.sign_in.first_factor_verification.error;
          msg = oauthError.long_message || oauthError.message || "";
          errorCode = oauthError.code || "";
        } else if (err?.response?.sign_in?.first_factor_verification?.error) {
          // Alternative path for error structure
          const oauthError = err.response.sign_in.first_factor_verification.error;
          msg = oauthError.long_message || oauthError.message || "";
          errorCode = oauthError.code || "";
        } else {
          // Fallback to standard error structure
          msg = (err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "").toString();
          errorCode = err?.errors?.[0]?.code || "";
        }
        
        // Debug logging for OAuth errors
        console.log("OAuth SignIn Error - Full Analysis:", {
          message: msg,
          code: errorCode,
          fullError: err,
          response: err?.response,
          signInData: err?.response?.data?.sign_in,
          firstFactorError: err?.response?.data?.sign_in?.first_factor_verification?.error,
          messageLower: msg.toLowerCase()
        });
        
        // Check if OAuth error indicates account doesn't exist
        if (msg.toLowerCase().includes("not found") || 
            msg.toLowerCase().includes("doesn't exist") || 
            msg.toLowerCase().includes("no account found") ||
            msg.toLowerCase().includes("identifier not found") ||
            msg.toLowerCase().includes("invalid external account") ||
            msg.toLowerCase().includes("external account not found") ||
            errorCode === "external_account_not_found") {
          // Redirect to sign up page for OAuth
          console.log("OAuth Account Not Found - Redirecting to signup...");
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
        // Redirect to sign up page with email pre-filled
        console.log("Redirecting to signup page...");
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
