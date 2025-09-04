import { useClerk } from '@clerk/nextjs';

export default function LogoutButton() {
  const clerk = useClerk();
  return <button onClick={() => clerk.signOut()}>Logout</button>;
}