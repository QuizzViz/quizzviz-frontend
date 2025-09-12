import { FC } from "react";

// Email/password sign-up form (controlled externally)
export const EmailPasswordSignUpForm: FC<{
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error?: string | null;
  loading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ email, setEmail, password, setPassword, error, loading, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-2">
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
);
