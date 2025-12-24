import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function usePlanCheck() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isSignedIn) {
        router.push('/signin');
        return;
      }

      try {
        // Check company
        const companyCheck = await fetch(`/api/company/check?owner_id=${user.id}`);
        const companyData = await companyCheck.json();

        if (!companyData.exists || !companyData.companies?.length) {
          setHasAccess(false);
          setNeedsOnboarding(true);
          setIsLoading(false);
          return;
        }

        // If company exists, grant access
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking company:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify your company. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [isSignedIn, router, user?.id]);

  return { isLoading, hasAccess, needsOnboarding };
}
