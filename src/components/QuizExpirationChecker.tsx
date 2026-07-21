import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface ExpirationCheckResult {
  success: boolean;
  message: string;
  processed?: number;
  expired?: number;
  errors?: string[];
}

export function QuizExpirationChecker({
  autoCheck = false,
  checkInterval = 5 * 60 * 1000, // 5 minutes
  companyId
}: {
  autoCheck?: boolean;
  checkInterval?: number;
  companyId?: string;
}) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkExpiration = async () => {
    if (!user) return;

    setIsChecking(true);
    try {
      // Pass the already-resolved company_id (metadata/localStorage aware,
      // works for owners and members alike) so the server doesn't have to
      // fall back to the owner-only /companies?owner_id= lookup, which
      // fails for non-owner members.
      const url = companyId
        ? `/api/quiz/check-expiration?company_id=${encodeURIComponent(companyId)}`
        : '/api/quiz/check-expiration';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: ExpirationCheckResult = await response.json();

      if (result.success) {
        setLastCheck(new Date());
        
        // Invalidate quiz cache to refresh My Quizzes page
        queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        
        if (result.expired && result.expired > 0) {
          toast({
            title: 'Quiz Expiration Check Complete',
            description: `Found and processed ${result.expired} expired quiz(es).`,
            variant: 'default',
          });
        }
        
        console.log('Expiration check result:', result);
      } else {
        toast({
          title: 'Expiration Check Failed',
          description: result.message || 'Failed to check quiz expirations',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error checking quiz expirations:', error);
      toast({
        title: 'Error',
        description: 'Failed to check quiz expirations',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-check mechanism
  useEffect(() => {
    if (!autoCheck || !user) return;

    // Check immediately on mount
    checkExpiration();

    // Set up interval for periodic checks
    const interval = setInterval(checkExpiration, checkInterval);

    return () => clearInterval(interval);
  }, [autoCheck, checkInterval, user, companyId]);

  // Manual trigger button
  const ManualCheckButton = () => (
    <button
      onClick={checkExpiration}
      disabled={isChecking}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {isChecking ? 'Checking...' : 'Check for Expired Quizzes'}
    </button>
  );

  return {
    checkExpiration,
    isChecking,
    lastCheck,
    ManualCheckButton
  };
}

// Hook for easier usage
export function useQuizExpirationChecker(options?: {
  autoCheck?: boolean;
  checkInterval?: number;
  companyId?: string;
}) {
  return QuizExpirationChecker(options || {});
}
