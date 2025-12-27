// src/lib/planCheck.js
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function usePlanCheck() {
  const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isUserLoaded) {
        return; // Wait for Clerk to finish loading
      }

      if (!isSignedIn) {
        router.push('/signin');
        return;
      }

      try {
        setIsLoading(true);
        const token = await user.getToken();
        
        // Check company
        const response = await fetch(`/api/company/check?owner_id=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch company data');
        }

        const companyData = await response.json();
        
        // Check if company exists
        const companyExists = companyData?.exists && 
                            companyData.companies?.length > 0;

        if (!companyExists) {
          setHasAccess(false);
          setNeedsOnboarding(true);
          setIsLoading(false);
          return;
        }

        // If we get here, company exists
        setHasAccess(true);
        setNeedsOnboarding(false);
        
      } catch (error) {
        console.error('Error checking company:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify your company. Please try again.',
          variant: 'destructive',
        });
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [isSignedIn, isUserLoaded, router, user]);

  return { 
    isLoading, 
    hasAccess, 
    needsOnboarding,
    // Add these for debugging
    debug: {
      isUserLoaded,
      isSignedIn,
      userId: user?.id
    }
  };
}