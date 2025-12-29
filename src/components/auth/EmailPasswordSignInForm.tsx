import { FC, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Email/password sign-in form (controlled externally)
export const EmailPasswordSignInForm: FC<{
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error?: string | null;
  loading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ email, setEmail, password, setPassword, error, loading, onSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
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
      <div className="relative">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          required
          className="h-10 w-full rounded-lg bg-input text-foreground placeholder:text-muted-foreground/70 border border-border px-3 pr-10 outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
    <button
      type="submit"
      disabled={loading}
      className="w-full inline-flex h-10 items-center justify-center rounded-lg px-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? "Signing in..." : "Sign in"}
    </button>
  </form>
);
}
