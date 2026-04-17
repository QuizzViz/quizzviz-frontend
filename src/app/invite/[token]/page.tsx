"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Head from 'next/head';
import { LoadingSpinner } from '@/components/ui/loading';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !params.token) return;

    const token = Array.isArray(params.token) ? params.token[0] : params.token;
    
    // Store the invite token in localStorage
    localStorage.setItem('invite-token', token);
    
    if (!user) {
      // No user signed in, redirect to signup
      router.push('/signup');
    } else {
      // User is already signed in, redirect to accept invite page
      router.push('/accept_invite');
    }
    
    setIsLoading(false);
  }, [isLoaded, user, router, params.token]);

  if (!isLoaded || isLoading) {
    return (
      <>
        <Head>
          <title>Invitation | QuizzViz</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <LoadingSpinner fullScreen={false} text="Processing invitation..." />
        </div>
      </>
    );
  }

  return null;
}