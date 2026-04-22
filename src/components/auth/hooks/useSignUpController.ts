import { useState, FormEvent } from "react";
import { useSignUp, useClerk, useUser, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";

export function useSignUpController() {
  const { signUp, isLoaded } = useSignUp();
  const { signIn } = useSignIn();
  const { setActive, signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "oauth_google">(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: "oauth_google") => {
    if (!isLoaded || !signUp || !signIn) return;
    if (user) {
      setError("You are already signed in. Use 'Switch account' to continue with another account.");
      return;
    }
    try {
      setOauthLoading(provider);

      sessionStorage.setItem('authIntent', 'signup');
      sessionStorage.setItem('signupAttemptTime', Date.now().toString());

      // Use signUp first — if user already exists, Clerk will throw
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/auth/callback",
      });
    } catch (err: any) {
      const msg = (err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "").toString();
      const code = err?.errors?.[0]?.code;

      console.log("OAuth SignUp Error:", { message: msg, code, fullError: err });

      // If account already exists, re-attempt with signIn
      if (
        code === "form_identifier_exists" ||
        code === "oauth_access_denied" ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("already been taken")
      ) {
        try {
          await signIn.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: "/sso-callback",
            redirectUrlComplete: "/dashboard",
          });
        } catch (signInErr: any) {
          setError("Failed to sign in with provider.");
          setOauthLoading(null);
        }
      } else if (
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("identifier not found")
      ) {
        router.push(`/signup?message=No account found. Please sign up with Google.`);
        setOauthLoading(null);
      } else {
        setError(msg || "Failed to continue with provider. Check provider configuration in Clerk.");
        setOauthLoading(null);
      }
    }
  };

  const submitSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || "Could not create account.";
      const errorCode = err?.errors?.[0]?.code;

      console.log("SignUp Error:", {
        message: errorMessage,
        code: errorCode,
        fullError: err,
        errors: err?.errors
      });

      // Check if the error indicates that account already exists - multiple scenarios
      const isAccountExists = 
        errorCode === "identifier_exists" ||
        errorMessage.toLowerCase().includes("already exists") ||
        errorMessage.toLowerCase().includes("already taken") ||
        errorMessage.toLowerCase().includes("email already exists") ||
        errorMessage.toLowerCase().includes("account already exists") ||
        errorMessage.toLowerCase().includes("user already exists") ||
        errorMessage.toLowerCase().includes("duplicate") ||
        errorMessage.toLowerCase().includes("email already registered") ||
        errorMessage.toLowerCase().includes("identifier already taken");

      if (isAccountExists) {
        // Redirect to sign in page with email pre-filled
        router.push(`/signin?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Account already exists. Please sign in.")}`);
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError(null);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/auth/callback");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Invalid verification code.");
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
    code,
    setCode,
    step,
    setStep,
    loading,
    oauthLoading,
    error,
    setError,
    isLoaded,
    user,
    // actions
    handleOAuth,
    submitSignUp,
    verifyCode,
    signOut,
    router,
  };
}