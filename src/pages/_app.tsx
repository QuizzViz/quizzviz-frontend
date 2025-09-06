import { ClerkProvider } from '@clerk/nextjs';
import type { AppProps } from 'next/app';
import '../app/globals.css';
import { Navbar } from '@/components/NavBar';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} {...pageProps}>
      <Navbar />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;


