import { FC } from "react";

// Email verification code form
export const VerificationForm: FC<{
  email: string;
  code: string;
  setCode: (v: string) => void;
  loading?: boolean;
  error?: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onChangeEmail: () => void;
}> = ({ email, code, setCode, loading, error, onSubmit, onChangeEmail }) => (
  <form onSubmit={onSubmit} className="space-y-3.5 mt-5">
    {error && (
      <div className="text-red-400 text-xs bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">{error}</div>
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
    <button type="submit" disabled={loading} className="w-full inline-flex h-10 items-center justify-center rounded-lg px-4 bg-primary text-primary-foreground hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 font-medium">
      {loading ? "Verifying..." : "Verify & Continue"}
    </button>
    <button type="button" onClick={onChangeEmail} className="w-full text-[11px] text-muted-foreground hover:text-foreground mt-1">
      Change email
    </button>
  </form>
);
