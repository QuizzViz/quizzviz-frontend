import { useState, FormEvent } from "react";
import { useSignUp, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";

// Consolidates all state and actions for the custom Sign Up flow
export function useSignUpController() {
  const { signUp, isLoaded } = useSignUp();
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
    if (!isLoaded || !signUp) return;
    if (user) {
      setError("You are already signed in. Use 'Switch account' to continue with another account.");
      return;
    }
    try {
      setOauthLoading(provider);
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/pricing",
      });
    } catch (err: any) {
      const msg = (err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "").toString();
      setError(msg || "Failed to continue with provider. Check provider configuration in Clerk.");
      setOauthLoading(null);
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
      setError(err?.errors?.[0]?.message || "Could not create account.");
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
        router.push("/pricing");
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
