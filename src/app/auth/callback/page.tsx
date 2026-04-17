"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Head from 'next/head';
import { LoadingSpinner } from '@/components/ui/loading';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    // Check if there's an invite token in localStorage
    const inviteToken = localStorage.getItem('invite-token');
    
    if (inviteToken) {
      // User came from an invite link, redirect to accept invite page
      router.push('/accept_invite');
    } else {
      // Normal signup flow, redirect to onboarding
      router.push('/onboarding');
    }
    
    setIsLoading(false);
  }, [isLoaded, router]);

  if (!isLoaded || isLoading) {
    return (
      <>
        <Head>
          <title>Authentication Callback | QuizzViz</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <LoadingSpinner fullScreen={false} text="Completing authentication..." />
        </div>
      </>
    );
  }

  return null;
}
