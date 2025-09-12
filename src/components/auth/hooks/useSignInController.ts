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
        await signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/dashboard",
        });
      } catch (err: any) {
        const msg = (err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "").toString();
        setError(msg || "Failed to continue with provider. Check provider configuration in Clerk.");
        setOauthLoading(null);
      }
    },
    [isLoaded, signIn, user]
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
      setError(err?.errors?.[0]?.message || "Invalid email or password.");
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
