import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn path="/signin" routing="path" signUpUrl="/signup" />;
}