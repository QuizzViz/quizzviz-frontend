import { useSignUp, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, FormEvent } from "react";
import { useRouter } from "next/router";

export default function SignUpPage() {
  const { signUp, isLoaded } = useSignUp();
  const { setActive } = useClerk();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = useCallback(
    async (provider: "oauth_google" | "oauth_linkedin") => {
      if (!isLoaded || !signUp) return;
      try {
        await signUp.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: "/dashboard",
          redirectUrlComplete: "/dashboard",
        });
      } catch (err) {
        console.error("OAuth sign-up error:", err);
        setError("Failed to continue with provider. Try email or another method.");
      }
    },
    [isLoaded, signUp]
  );

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
      const msg = err?.errors?.[0]?.message || "Could not create account.";
      setError(msg);
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
        router.push("/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || "Invalid verification code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-sm animate-fade-in-smooth">
        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-primary/60 via-primary/20 to-primary/60">
          <div className="rounded-2xl p-5 md:p-6 pt-2 md:pt-2 glassmorphism shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative w-20 h-20">
                <Link href="/">
                  <Image
                    src="/QuizzViz-logo.png"
                    alt="QuizzViz Logo"
                    fill
                    className="object-contain drop-shadow"
                    priority
                  />
                </Link>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
              <p className="text-[13px] leading-relaxed text-muted-foreground">Join QuizzViz to get started</p>
            </div>

            {step === "form" && (
              <>
                <div className="mt-5 grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => handleOAuth("oauth_google")}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg px-3 bg-primary text-primary-foreground hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="w-4 h-4 mr-2" aria-hidden>
                      <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.7-37-5.1-54.8H272v103.8h146.9c-6.3 34.2-25 63.2-53.3 82.7v68h86.3c50.5-46.6 81.6-115.2 81.6-199.7z"/>
                      <path fill="#34A853" d="M272 544.3c72.9 0 134.2-24.1 178.9-65.2l-86.3-68c-24 16.1-54.7 25.6-92.6 25.6-71 0-131.1-47.9-152.6-112.1H31.6v70.3C76 486.8 169 544.3 272 544.3z"/>
                      <path fill="#FBBC05" d="M119.4 324.6c-10.4-31.2-10.4-65.9 0-97.1v-70.3H31.6c-42.1 84.2-42.1 183.5 0 267.7l87.8-70.3z"/>
                      <path fill="#EA4335" d="M272 107.7c39.7-.6 77.8 14.7 106.9 42.7l80.2-80.2C404.8 24.5 342.9-.4 272 0 169 0 76 57.5 31.6 146.8l87.8 70.7C140.9 155.8 201 107.7 272 107.7z"/>
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    onClick={() => handleOAuth("oauth_linkedin")}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg px-3 bg-[#0A66C2] text-white hover:opacity-95 transition focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/60 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="currentColor"><path d="M20.451 20.451h-3.554v-5.569c0-1.328-.027-3.036-1.852-3.036-1.853 0-2.136 1.447-2.136 2.943v5.662H9.356V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.369-1.85 3.602 0 4.267 2.37 4.267 5.455v6.285zM5.337 7.433a2.063 2.063 0 11.001-4.127 2.063 2.063 0 01-.001 4.127zM7.114 20.451H3.559V9h3.555v11.451z"/></svg>
                    Continue with LinkedIn
                  </button>
                </div>

                <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span>or sign up with email</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={submitSignUp} className="space-y-2">
                  {error && (
                    <div className="text-red-400 text-xs bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-medium text-foreground/90">Email address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="h-10 w-full rounded-lg bg-input text-foreground placeholder:text-muted-foreground/70 border border-border px-3 outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="password" className="text-xs font-medium text-foreground/90">Password</label>
                    <input
                      id="password"
                      type="password"
                      required
                      className="h-10 w-full rounded-lg bg-input text-foreground placeholder:text-muted-foreground/70 border border-border px-3 outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex h-10 items-center justify-center rounded-lg px-4 bg-primary text-primary-foreground hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 font-medium mt-3"
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>
              <p className="mt-3 text-[12px] text-center text-muted-foreground">
                Already have an account? <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
              </p>
              </>
            )}

            {step === "verify" && (
              <form onSubmit={verifyCode} className="space-y-3.5 mt-5">
                {error && (
                  <div className="text-red-400 text-xs bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  We sent a 6-digit code to <span className="text-foreground">{email}</span>
                </p>
                <div className="space-y-2">
                  <label htmlFor="code" className="text-xs">Verification code</label>
                  <input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    minLength={6}
                    maxLength={6}
                    required
                    className="tracking-widest text-center h-10 w-full rounded-lg bg-input text-foreground placeholder:text-muted-foreground/70 border border-border px-3 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex h-10 items-center justify-center rounded-lg px-4 bg-primary text-primary-foreground hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 font-medium"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full text-[11px] text-muted-foreground hover:text-foreground mt-1"
                >
                  Change email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
