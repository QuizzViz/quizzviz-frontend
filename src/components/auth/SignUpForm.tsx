import { SignUp } from '@clerk/nextjs';

export default function SignUpForm() {
  return <SignUp path="/signup" routing="path" signInUrl="/signin" />;
}