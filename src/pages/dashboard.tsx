import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import LogoutButton from "@/components/auth/LogoutButton";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-center h-screen mt-28">
      <SignedIn>
        <h1>Welcome, {user?.firstName || "User"}!</h1>
        <LogoutButton />
      </SignedIn>

      <SignedOut>
        <p>You are signed out. Please sign in first.</p>
      </SignedOut>
    </div>
  );
}

