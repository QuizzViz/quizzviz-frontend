import { SignIn } from '@clerk/nextjs';

export default function SignInForm() {
  return <SignIn path="/signin" routing="path" signUpUrl="/signup" />;
}