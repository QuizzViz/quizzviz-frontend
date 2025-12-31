import Link from "next/link";
import { LogoHeader } from "@/components/auth/LogoHeader";
import { OAuthProviderButton } from "@/components/auth/OAuthProviderButton";
import { EmailPasswordSignInForm } from "@/components/auth/EmailPasswordSignInForm";
import { useSignInController } from "@/components/auth/hooks/useSignInController";
import { useEffect, useState } from "react";
import Head from "next/head";

export default function SignInPage() {
  const {
    email, setEmail, password, setPassword, loading, oauthLoading, error,
    isLoaded, user, handleOAuth, onSubmit, signOut, router
  } = useSignInController();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (user) {
      setIsRedirecting(true);
      router.push("/dashboard");
    }
  }, [user, router]);

  if (isRedirecting || (isLoaded && user)) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center gap-4 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-foreground/80">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <>
    <Head>
      <title> Signin | QuizzViz </title>
      <meta name="description" content="Signin to QuizzViz" />
        <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-sm animate-fade-in-smooth">
        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-primary/60 via-primary/20 to-primary/60">
          <div className="rounded-2xl p-5 md:p-6 pt-2 md:pt-2 glassmorphism shadow-xl">
            <LogoHeader title="Welcome back" subtitle="Sign in to continue" />

            <div className="mt-5 grid grid-cols-1 gap-2.5">
              <OAuthProviderButton
                onClick={() => handleOAuth("oauth_google")}
                disabled={!isLoaded || !!user || loading || oauthLoading !== null}
                loading={oauthLoading === "oauth_google"}
                text={oauthLoading === "oauth_google" ? "Redirecting..." : "Continue with Google"}
              />
            </div>

            <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or continue with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {!user ? (
              <EmailPasswordSignInForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                loading={loading}
                onSubmit={onSubmit}
              />
            ) : (
              <div className="space-y-3">
                {error && (
                  <div className="text-red-400 text-xs bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">{error}</div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  You are already signed in as <span className="text-foreground">{user?.primaryEmailAddress?.emailAddress || user?.fullName || "current user"}</span>.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => router.push('/dashboard')} 
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30  active:scale-[0.98] flex items-center justify-center"
                  >
                    Go to Dashboard
                  </button>
                  <button 
                    onClick={async () => { try { await signOut(); router.push('/signin'); } catch {} }} 
                    className="w-full bg-gray-800 hover:bg-gray-700/80 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border border-gray-700"
                  >
                    Switch account (sign out first)
                  </button>
                </div>
              </div>
            )}

            <p className="mt-3 text-[12px] text-center text-muted-foreground">
              Create new account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}