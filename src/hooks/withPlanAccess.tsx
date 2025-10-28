import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUserPlanContext } from '@/contexts/UserPlanContext';
import { toast } from '@/hooks/use-toast';

type PlanAccessProps = {
  requiredPlan?: 'Free' | 'Consumer' | 'Elite' | 'Business';
  redirectTo?: string;
  showError?: boolean;
};

export function withPlanAccess<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options: PlanAccessProps = {}
) {
  const { requiredPlan = 'Free', redirectTo = '/pricing', showError = true } = options;

  const WithPlanAccess = (props: T) => {
    const router = useRouter();
    const { plan, isLoading, error } = useUserPlanContext();

    useEffect(() => {
      if (isLoading || error) return;
      
      const planOrder = ['Free', 'Consumer', 'Elite', 'Business'] as const;
      const currentPlanIndex = plan ? planOrder.indexOf(plan) : -1;
      const requiredPlanIndex = planOrder.indexOf(requiredPlan);

      if (currentPlanIndex < requiredPlanIndex) {
        if (showError) {
          toast({
            title: 'Upgrade Required',
            description: `This feature requires the ${requiredPlan} plan or higher.`,
            variant: 'destructive',
          });
        }
        
        if (redirectTo) {
          router.push(redirectTo);
        }
      }
    }, [plan, isLoading, error, router, requiredPlan, redirectTo, showError]);

    // If we're still loading, show a loading state or null
    if (isLoading) {
      return <div>Loading plan information...</div>;
    }

    // If there was an error, show an error state
    if (error) {
      return <div>Error loading plan information. Please try again later.</div>;
    }

    // Check if user has the required plan
    const planOrder = ['Free', 'Consumer', 'Elite', 'Business'] as const;
    const currentPlanIndex = plan ? planOrder.indexOf(plan) : -1;
    const requiredPlanIndex = planOrder.indexOf(requiredPlan);
    const hasAccess = currentPlanIndex >= requiredPlanIndex;

    if (!hasAccess) {
      return null; // or a placeholder/upsell component
    }

    return <WrappedComponent {...(props as T)} />;
  };

  // Set a display name for the component for better debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithPlanAccess.displayName = `withPlanAccess(${displayName})`;

  return WithPlanAccess;
}

// Usage example:
// export default withPlanAccess(MyComponent, { requiredPlan: 'Business' });
