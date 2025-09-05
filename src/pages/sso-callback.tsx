import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  // This page completes the OAuth flow for Clerk (Google/LinkedIn, etc.)
  return <AuthenticateWithRedirectCallback />;
}
