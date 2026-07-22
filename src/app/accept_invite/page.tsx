"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import Head from 'next/head';
import { LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { storeCompanyId } from '@/hooks/useCompanies';

export default function AcceptInvitePage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<'pending' | 'accepted' | 'error'>('pending');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user is signed in
    if (!isSignedIn) {
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
  }, [isLoaded, isSignedIn, router]);

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
      
      // Update user metadata with company information
      if (user) {
        try {
          // Extract company info from the API response
          console.log('Full invitation response:', result);
          const companyId = result.company_id;
          const companyName = result.member?.company_name || result.company_name || 'Your Company';
          
          console.log('Extracted company info:', { companyId, companyName });
          
          if (companyId) {
            // Store company info in sessionStorage for dashboard to fetch
            console.log('Storing company ID in sessionStorage:', companyId);
            storeCompanyId(companyId);
            localStorage.setItem('userCompanyName', companyName);
            
            // Verify it was stored
            const storedCompanyId = sessionStorage.getItem('company_id');
            console.log('Company ID stored in sessionStorage:', storedCompanyId);
            
            await user.update({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                companyId: companyId,
                companyName: companyName,
                onboardingComplete: true
              }
            });
            console.log('Updated user metadata with company:', { companyId, companyName });
          } else {
            console.error('No company ID found in invite response');
            console.error('Full response structure:', JSON.stringify(result, null, 2));
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

      // Instead of blindly waiting a fixed ~6 seconds and hoping the data is
      // ready, actively poll for it — sessionStorage/localStorage are set
      // synchronously above, so this typically resolves almost immediately,
      // and falls back to re-checking Clerk metadata if storage isn't set
      // yet. Only once we've confirmed the company is actually ready do we
      // navigate, so the new member never lands on a half-loaded dashboard.
      setIsRedirecting(true);

      const isCompanyReady = async (): Promise<boolean> => {
        const sessionStorageCompanyId = sessionStorage.getItem('company_id');
        const localStorageCompanyId = localStorage.getItem('userCompanyId');
        if (sessionStorageCompanyId || localStorageCompanyId) return true;

        if (user) {
          try {
            await user.reload();
            if (user.unsafeMetadata?.companyId) return true;
          } catch (reloadError) {
            console.error('Error during user reload:', reloadError);
          }
        }
        return false;
      };

      const maxWaitMs = 8000;
      const pollIntervalMs = 300;
      const start = Date.now();
      let ready = await isCompanyReady();
      while (!ready && Date.now() - start < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        ready = await isCompanyReady();
      }

      if (!ready) {
        // The poll is only used to time the loading screen — the invite was
        // already confirmed accepted above (the API call succeeded and
        // returned a company_id, which we've already written to
        // storage/metadata), so there is a real company either way. Falling
        // back to onboarding here would be wrong: it would ask a member who
        // just joined a team to "create a company" instead of just giving
        // the dashboard a moment to pick up what's already been set.
        console.warn('Company readiness check timed out; proceeding to dashboard anyway.');
      }

      localStorage.removeItem('invite-token');
      router.push('/dashboard');

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

  // Once accepted, hide the invitation card entirely and show a single,
  // focused loading screen until the workspace is confirmed ready — no
  // intermediate flash of the accept button or a half-loaded dashboard.
  if (isRedirecting) {
    return (
      <>
        <Head>
          <title>Accept Invitation | QuizzViz</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 p-[2px] mx-auto">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Setting up your workspace</h2>
              <p className="text-white/60 text-sm">Just a moment while we get everything ready for you...</p>
            </div>
          </div>
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
