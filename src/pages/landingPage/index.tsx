import dynamic from 'next/dynamic';

// Dynamically import the client component with SSR disabled
const ClientLandingPage = dynamic(
  () => import('./ClientLandingPage'),
  { ssr: false }
);

// This is now a server component that renders the client component
export default function LandingPage() {
  return <ClientLandingPage />;
}
