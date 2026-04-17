"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import Head from 'next/head';
import { LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';

export default function AcceptInvitePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user is signed in
    if (!user) {
      // Redirect to signup page
      router.push('/signup');
      return;
    }

    // Check if there's an invite token in localStorage
    const inviteToken = localStorage.getItem('invite-token');
    if (!inviteToken) {
      // No invite token, redirect to onboarding
      router.push('/onboarding');
      return;
    }

    setIsLoading(false);
  }, [isLoaded, user, router]);

  const handleAcceptInvite = async () => {
    const inviteToken = localStorage.getItem('invite-token');
    if (!inviteToken || !user) return;

    setIsAccepting(true);
    try {
      const token = await getToken();
      
      const response = await fetch('/api/company-members/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: inviteToken,
          user_id: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      const result = await response.json();
      
      // Remove token from localStorage
      localStorage.removeItem('invite-token');
      
      // Update user metadata with company information
      if (user) {
        try {
          const companyId = result.company_id || result.company?.id;
          const companyName = result.company_name || result.company?.name || 'QuizzViz';
          
          if (companyId) {
            await user.update({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                companyId: companyId,
                companyName: companyName,
                onboardingComplete: true
              }
            });
          }
        } catch (metadataError) {
          console.error('Error updating user metadata:', metadataError);
        }
      }
      
      toast({
        title: "Welcome to the Team!",
        description: "You have successfully joined the team.",
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to accept invitation", 
        variant: "destructive" 
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <>
        <Head>
          <title>Accept Invitation | QuizzViz</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <LoadingSpinner fullScreen={false} text="Preparing your invitation..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Accept Invitation | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome to<span className="font-bold ml-3 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">QuizzViz</span>
            </h1>
            <p className="text-white/70">
              You've been invited to join a team!
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl border border-white/10 p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 p-[2px] mx-auto mb-4">
                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">
                Team Invitation
              </h2>
              <p className="text-white/60 text-sm">
                Click the button below to accept your invitation and join the team.
              </p>
            </div>

            <button
              onClick={handleAcceptInvite}
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  Accepting Invitation...
                </>
              ) : (
                'Accept Invitation'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-white/40 text-sm">
              By accepting, you'll join this team and can start collaborating.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
